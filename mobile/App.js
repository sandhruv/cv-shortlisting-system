import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  BackHandler,
  Platform,
  RefreshControl,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Linking,
} from "react-native";
import { WebView } from "react-native-webview";

const WEBSITE_URL = "https://cv-shortlisting-system-2.onrender.com";
const APP_NAME = "CV Shortlisting";
const ALLOWED_HOSTS = ["cv-shortlisting-system-2.onrender.com", "cv-shortlisting-system.onrender.com", "localhost", "127.0.0.1"];

export default function App() {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [canGoBack]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    webViewRef.current?.reload();
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  const onShouldStartLoadWithRequest = useCallback((event) => {
    const url = event.url;
    if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("sms:")) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    try {
      const hostname = new URL(url).hostname;
      if (ALLOWED_HOSTS.includes(hostname)) return true;
      return false;
    } catch {
      return false;
    }
  }, []);

  const injectedJS = `
    (function() {
      document.addEventListener('click', function(e) {
        var link = e.target.closest('a');
        if (link) {
          var href = link.getAttribute('href');
          if (href && href.startsWith('http')) {
            try {
              var h = new URL(href).hostname;
              var allowed = ${JSON.stringify(ALLOWED_HOSTS)};
              if (!allowed.includes(h)) {
                e.preventDefault();
                window.ReactNativeWebView.postMessage(JSON.stringify({type:'blocked', url:href}));
              }
            } catch(ex) {}
          }
        }
      }, true);
      true;
    })();
  `;

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          {!isConnected && <Text style={styles.offlineMsg}>No internet connection.</Text>}
          <Text style={styles.retryBtn} onPress={() => { setError(null); setLoading(true); webViewRef.current?.reload(); }}>
            Retry
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <WebView
        ref={webViewRef}
        source={{ uri: WEBSITE_URL }}
        style={styles.webview}
        onLoadStart={() => { setLoading(true); setError(null); }}
        onLoadEnd={() => { setLoading(false); setRefreshing(false); }}
        onLoadProgress={(e) => setLoadProgress(e.nativeEvent.progress)}
        onError={(e) => { setError(e.nativeEvent.description || "Failed to load"); setLoading(false); }}
        onHttpError={(e) => { if (e.nativeEvent.statusCode >= 400) setError("Server error: " + e.nativeEvent.statusCode); }}
        onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        onMessage={() => {}}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="compatibility"
        thirdPartyCookiesEnabled
        cacheEnabled
        startInLoadingState
        bounces={false}
        nestedScrollEnabled
        injectedJavaScript={injectedJS}
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>{APP_NAME}</Text>
            {loadProgress > 0 && loadProgress < 1 && (
              <View style={styles.progressWrap}>
                <View style={[styles.progressBar, { width: (loadProgress * 100) + "%" }]} />
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  webview: { flex: 1 },
  loadingOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center", alignItems: "center", backgroundColor: "#fff",
  },
  loadingText: { marginTop: 12, fontSize: 16, fontWeight: "600", color: "#333" },
  progressWrap: { width: "60%", height: 3, backgroundColor: "#e5e7eb", borderRadius: 2, marginTop: 10, overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: "#3B82F6", borderRadius: 2 },
  errorBox: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  errorTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937", marginBottom: 8 },
  errorMsg: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 8 },
  offlineMsg: { fontSize: 13, color: "#9CA3AF", textAlign: "center", marginBottom: 16 },
  retryBtn: {
    fontSize: 15, fontWeight: "600", color: "#fff", backgroundColor: "#3B82F6",
    paddingHorizontal: 28, paddingVertical: 10, borderRadius: 8,
  },
});
