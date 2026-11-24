package com.mrall.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.util.Base64;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.webkit.WebViewAssetLoader;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final int FILE_PICKER_REQUEST = 1001;
    private static final int SAVE_FILE_REQUEST = 1002;
    private WebView web;
    private ValueCallback<Uri[]> pendingFileCallback;
    private byte[] pendingSaveBytes;
    private String pendingSaveMime = "application/octet-stream";
    private String pendingSaveName = "mrall-file";

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        web.setLayoutParams(new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setSupportMultipleWindows(false);
        settings.setBuiltInZoomControls(false);
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        web.setWebViewClient(new WebViewClient() {
            @Override public android.webkit.WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                android.webkit.WebResourceResponse r = loader.shouldInterceptRequest(request.getUrl());
                return r != null ? r : super.shouldInterceptRequest(view, request);
            }
            @Override public android.webkit.WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                android.webkit.WebResourceResponse r = loader.shouldInterceptRequest(Uri.parse(url));
                return r != null ? r : super.shouldInterceptRequest(view, url);
            }
            @Override public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                String css = "@media(max-width:900px){#mobileMenuToggle{display:grid!important;visibility:visible!important;opacity:1!important;position:relative!important;z-index:140!important}#sidebarToggle{display:none!important}header{position:relative!important;z-index:130!important;box-sizing:border-box!important;width:auto!important;max-width:none!important;margin:8px 8px 12px!important;padding:10px!important}.v7-headrow{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;gap:8px!important;min-width:0!important}.v7-brand{flex:1 1 auto!important;min-width:0!important}.v7-brand h1{font-size:clamp(15px,4.1vw,19px)!important}.v7-search,.v7-head-actions{display:none!important}nav{position:fixed!important;display:flex!important;top:0!important;bottom:0!important;left:0!important;right:auto!important;width:min(82vw,290px)!important;height:100vh!important;height:100dvh!important;margin:0!important;padding:78px 12px 20px!important;box-sizing:border-box!important;flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;gap:8px!important;overflow-y:auto!important;overflow-x:hidden!important;transform:translateX(-110%)!important;transition:transform .22s ease!important;z-index:135!important;background:#061723!important;border-right:1px solid #1d4964!important;box-shadow:12px 0 32px rgba(0,0,0,.38)!important}nav button{display:block!important;visibility:visible!important;flex:0 0 auto!important;width:100%!important;min-width:0!important;min-height:50px!important;text-align:left!important;justify-content:flex-start!important;padding:11px 14px!important;font-size:13px!important}body.mobile-menu-open nav{transform:translateX(0)!important}body.mobile-menu-open:after{content:\"\";position:fixed;inset:0;background:rgba(0,0,0,.52);z-index:125;pointer-events:auto}main{margin:0!important;width:100%!important;max-width:100%!important;padding:10px!important}}@media(min-width:901px){#mobileMenuToggle{display:none!important}}";
                String js = "(function(){if(document.getElementById('mrall-native-sidebar-fix'))return;var s=document.createElement('style');s.id='mrall-native-sidebar-fix';s.textContent=" + "\"@media(max-width:900px){#mobileMenuToggle{display:grid!important;visibility:visible!important;opacity:1!important;position:relative!important;z-index:140!important}#sidebarToggle{display:none!important}header{position:relative!important;z-index:130!important;box-sizing:border-box!important;width:auto!important;max-width:none!important;margin:8px 8px 12px!important;padding:10px!important}.v7-headrow{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;gap:8px!important;min-width:0!important}.v7-brand{flex:1 1 auto!important;min-width:0!important}.v7-brand h1{font-size:clamp(15px,4.1vw,19px)!important}.v7-search,.v7-head-actions{display:none!important}nav{position:fixed!important;display:flex!important;top:0!important;bottom:0!important;left:0!important;right:auto!important;width:min(82vw,290px)!important;height:100vh!important;height:100dvh!important;margin:0!important;padding:78px 12px 20px!important;box-sizing:border-box!important;flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;gap:8px!important;overflow-y:auto!important;overflow-x:hidden!important;transform:translateX(-110%)!important;transition:transform .22s ease!important;z-index:135!important;background:#061723!important;border-right:1px solid #1d4964!important;box-shadow:12px 0 32px rgba(0,0,0,.38)!important}nav button{display:block!important;visibility:visible!important;flex:0 0 auto!important;width:100%!important;min-width:0!important;min-height:50px!important;text-align:left!important;justify-content:flex-start!important;padding:11px 14px!important;font-size:13px!important}body.mobile-menu-open nav{transform:translateX(0)!important}body.mobile-menu-open:after{content:\\\"\\\";position:fixed;inset:0;background:rgba(0,0,0,.52);z-index:125;pointer-events:auto}main{margin:0!important;width:100%!important;max-width:100%!important;padding:10px!important}}@media(min-width:901px){#mobileMenuToggle{display:none!important}}\"" + ";document.head.appendChild(s);})();";
                view.evaluateJavascript(js, null);
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (pendingFileCallback != null) pendingFileCallback.onReceiveValue(null);
                pendingFileCallback = callback;
                Intent intent = params.createIntent();
                try { startActivityForResult(intent, FILE_PICKER_REQUEST); }
                catch (Exception ex) { pendingFileCallback = null; Toast.makeText(MainActivity.this, "Pemilih file tidak tersedia", Toast.LENGTH_LONG).show(); return false; }
                return true;
            }
        });
        web.addJavascriptInterface(new NativeBridge(), "MRAllNative");
        setContentView(web);
        web.loadUrl("https://appassets.androidplatform.net/assets/index.html");
    }

    private class NativeBridge {
        @JavascriptInterface public void saveBase64File(String name, String mime, String base64) {
            try {
                pendingSaveName = (name == null || name.trim().isEmpty()) ? "mrall-file" : name.replaceAll("[/\\\\\\\\]", "_");
                pendingSaveMime = (mime == null || mime.trim().isEmpty()) ? "application/octet-stream" : mime;
                pendingSaveBytes = Base64.decode(base64, Base64.DEFAULT);
                runOnUiThread(() -> {
                    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType(pendingSaveMime.split(";")[0]);
                    intent.putExtra(Intent.EXTRA_TITLE, pendingSaveName);
                    startActivityForResult(intent, SAVE_FILE_REQUEST);
                });
            } catch (Exception ex) { runOnUiThread(() -> Toast.makeText(MainActivity.this, "Gagal menyiapkan file", Toast.LENGTH_LONG).show()); }
        }
        @JavascriptInterface public void printHtml(String htmlBase64) {
            final String decoded;
            try { decoded = new String(Base64.decode(htmlBase64, Base64.DEFAULT), StandardCharsets.UTF_8); }
            catch (Exception e) { runOnUiThread(() -> Toast.makeText(MainActivity.this, "Nota gagal dibuka", Toast.LENGTH_LONG).show()); return; }
            runOnUiThread(() -> {
                WebView printView = new WebView(MainActivity.this);
                printView.setWebViewClient(new WebViewClient() {
                    @Override public void onPageFinished(WebView view, String url) {
                        try {
                            PrintManager manager = (PrintManager) getSystemService(PRINT_SERVICE);
                            manager.print("MR ALL IN Nota", view.createPrintDocumentAdapter("MR ALL IN Nota"), new PrintAttributes.Builder().build());
                        } catch (Exception e) { Toast.makeText(MainActivity.this, "Layanan cetak tidak tersedia", Toast.LENGTH_LONG).show(); }
                    }
                });
                printView.loadDataWithBaseURL(null, decoded, "text/html", "UTF-8", null);
            });
        }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_PICKER_REQUEST) {
            if (pendingFileCallback != null) {
                Uri[] result = null;
                if (resultCode == RESULT_OK && data != null) {
                    Uri uri = data.getData(); if (uri != null) result = new Uri[]{uri};
                }
                pendingFileCallback.onReceiveValue(result); pendingFileCallback = null;
            }
            return;
        }
        if (requestCode == SAVE_FILE_REQUEST) {
            if (resultCode == RESULT_OK && data != null && data.getData() != null && pendingSaveBytes != null) {
                try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                    if (out == null) throw new IllegalStateException("No output stream");
                    out.write(pendingSaveBytes); out.flush();
                    Toast.makeText(this, "File berhasil disimpan", Toast.LENGTH_LONG).show();
                } catch (Exception e) { Toast.makeText(this, "Gagal menyimpan file: " + e.getMessage(), Toast.LENGTH_LONG).show(); }
            }
            pendingSaveBytes = null;
        }
    }

    @Override public void onBackPressed() { if (web != null && web.canGoBack()) web.goBack(); else super.onBackPressed(); }
}
