package com.starter.admin.app

import android.graphics.Color
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import kotlin.math.max

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)

    val controller = WindowInsetsControllerCompat(window, window.decorView)
    controller.isAppearanceLightStatusBars = true
    controller.isAppearanceLightNavigationBars = true
    window.decorView.setBackgroundColor(Color.WHITE)

    val content = findViewById<ViewGroup>(android.R.id.content)
    content.setBackgroundColor(Color.WHITE)

    // Inset WebView for status + nav bars so the app bottom bar sits
    // flush above the OS navigation (no extra CSS gap).
    ViewCompat.setOnApplyWindowInsetsListener(content) { view, windowInsets ->
      val bars =
        windowInsets.getInsets(
          WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
        )
      val top = max(bars.top, statusBarHeightPx())
      view.setPadding(bars.left, top, bars.right, bars.bottom)
      (view as? ViewGroup)?.clipToPadding = true
      // Bottom safe-area handled natively — keep CSS var at 0 for the bar.
      injectCssVar("--sab", "0px")
      windowInsets
    }
    ViewCompat.requestApplyInsets(content)
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    webView.setBackgroundColor(Color.WHITE)
    webView.post { injectCssVar("--sab", "0px") }
    ViewCompat.requestApplyInsets(findViewById(android.R.id.content))
  }

  private fun injectCssVar(name: String, value: String) {
    val webView = findWebView(findViewById(android.R.id.content)) ?: return
    val script =
      "document.documentElement.style.setProperty('$name','$value');"
    webView.evaluateJavascript(script, null)
  }

  private fun findWebView(root: ViewGroup): WebView? {
    for (i in 0 until root.childCount) {
      when (val child = root.getChildAt(i)) {
        is WebView -> return child
        is ViewGroup -> findWebView(child)?.let { return it }
      }
    }
    return null
  }

  private fun statusBarHeightPx(): Int {
    val resId = resources.getIdentifier("status_bar_height", "dimen", "android")
    return if (resId > 0) {
      resources.getDimensionPixelSize(resId)
    } else {
      (24 * resources.displayMetrics.density).toInt()
    }
  }
}
