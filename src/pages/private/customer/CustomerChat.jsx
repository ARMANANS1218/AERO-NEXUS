import React from "react";
import { jwtDecode } from "jwt-decode";
import ChatBot from "./customerChat/ChatInterface";

export default function CustomerChat() {
  const token = localStorage.getItem("token");
  const decoded = token ? jwtDecode(token) : null;
  const currentUserId = decoded?.id;

  return (
    <div className="w-full h-full">
      <ChatBot currentUserId={currentUserId} />
    </div>
  );
}
