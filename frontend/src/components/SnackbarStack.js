import React, { useState, useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";

// Component to handle multiple snackbar alerts, displaying them in a stack
function SnackbarStack() {
  const [snackbars, setSnackbars] = useState([]);

  // Generate a unique ID for each snackbar message
  const addSnackbar = (
    message,
    severity = "success",
    autoHideDuration = 6000,
  ) => {
    const id = new Date().getTime() + Math.random();
    setSnackbars((prev) => [
      ...prev,
      { id, message, severity, autoHideDuration },
    ]);
    return id;
  };

  const removeSnackbar = (id) => {
    setSnackbars((prev) => prev.filter((snackbar) => snackbar.id !== id));
  };

  // Expose methods via window for global access
  useEffect(() => {
    window.snackbarStack = {
      addSnackbar,
      removeSnackbar,
      clearAll: () => setSnackbars([]),
    };

    return () => {
      delete window.snackbarStack;
    };
  }, []);

  return (
    <>
      {snackbars.map((snackbar, index) => (
        <Snackbar
          key={snackbar.id}
          open={true}
          autoHideDuration={snackbar.autoHideDuration}
          onClose={() => removeSnackbar(snackbar.id)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          style={{ bottom: `${index * 60 + 16}px` }} // Stack vertically
        >
          <Alert
            onClose={() => removeSnackbar(snackbar.id)}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
}

export default SnackbarStack;
