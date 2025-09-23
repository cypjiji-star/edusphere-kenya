export const isDataSaver = () =>
  "connection" in navigator && (navigator as any).connection.saveData === true;
