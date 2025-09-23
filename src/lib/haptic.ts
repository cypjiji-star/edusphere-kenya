export const light = () => {
  if ("vibrate" in navigator) navigator.vibrate(10);
  // Capacitor Haptics plugin check
  if (
    !!(window as any).Capacitor &&
    (window as any).Capacitor.isPluginAvailable("Haptics")
  ) {
    import("@capacitor/haptics").then((haptics) =>
      haptics.Haptics.impact({ style: "light" }),
    );
  }
};
