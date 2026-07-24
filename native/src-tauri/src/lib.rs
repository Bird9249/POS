// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
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
