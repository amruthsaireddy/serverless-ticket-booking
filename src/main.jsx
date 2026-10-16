import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import "./index.css";
import App from "./App.jsx";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "us-east-1_LyX0GgB18",
      userPoolClientId: "6ie2vao2oatclqdlghj3o298q9",
      loginWith: { email: true },
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Authenticator>
      <App />
    </Authenticator>
  </StrictMode>
);