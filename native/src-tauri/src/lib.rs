// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri_plugin_sql::{Migration, MigrationKind};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("ສະບາຍດີ, {}! ທ່ານໄດ້ຮັບການທັກທາຍຈາກ Rust!", name)
}

/// Allow camera/mic getUserMedia on Linux WebKitGTK.
///
/// WebKitGTK denies any permission the embedder does not handle, so barcode
/// scanning via `navigator.mediaDevices.getUserMedia` fails with
/// `NotAllowedError` unless we approve `UserMediaPermissionRequest`.
#[cfg(any(
    target_os = "linux",
    target_os = "dragonfly",
    target_os = "freebsd",
    target_os = "netbsd",
    target_os = "openbsd"
))]
fn install_linux_media_permissions<R: tauri::Runtime>(webview: &tauri::Webview<R>) {
    use webkit2gtk::glib::prelude::*;
    use webkit2gtk::{PermissionRequestExt, WebViewExt};

    let _ = webview.with_webview(|platform_webview| {
        platform_webview
            .inner()
            .connect_permission_request(|_, request| {
                if request.is::<webkit2gtk::UserMediaPermissionRequest>()
                    || request.is::<webkit2gtk::DeviceInfoPermissionRequest>()
                {
                    request.allow();
                    true
                } else {
                    false
                }
            });
    });
}

fn catalog_migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create_local_catalog",
        sql: r#"
CREATE TABLE IF NOT EXISTS categories_local (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products_local (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  image TEXT,
  barcode TEXT,
  sku TEXT,
  cost_price INTEGER,
  sell_price INTEGER NOT NULL,
  category_id TEXT,
  category_name TEXT,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_products_local_barcode
  ON products_local (barcode)
  WHERE barcode IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_local_updated
  ON products_local (updated_at);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
"#,
        kind: MigrationKind::Up,
    }]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:pos.db", catalog_migrations())
                .build(),
        )
        .plugin(
            tauri::plugin::Builder::<_, ()>::new("desktop-media-permissions")
                .on_webview_ready(|webview| {
                    #[cfg(any(
                        target_os = "linux",
                        target_os = "dragonfly",
                        target_os = "freebsd",
                        target_os = "netbsd",
                        target_os = "openbsd"
                    ))]
                    install_linux_media_permissions(&webview);

                    #[cfg(not(any(
                        target_os = "linux",
                        target_os = "dragonfly",
                        target_os = "freebsd",
                        target_os = "netbsd",
                        target_os = "openbsd"
                    )))]
                    let _ = &webview;
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
