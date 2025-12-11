import React, { useEffect, useState } from "react";
// import {
//   initSocket,
//   joinUserRoom,
//   onIncomingCall,
//   sendAnswer,
//   onIceCandidate,
// } from "../../sockets/callSocket";
// import {
//   initPeerConnection,
//   getMediaStream,
//   addTracks,
//   createAnswer,
//   setRemoteDescription,
//   addIceCandidate,
//   setIceCandidateCallback,
// } from "../../utils/webrtc";

// import { useUpdateCallStatusMutation } from "../../features/room/roomApi";
// import IncomingCallDialog from "./IncomingCallModal";
import VideoCallModal from "../../../components/common/VideoCallModal";
import EmailComponent from "../../../components/Email/EmailComponent";
import { jwtDecode } from "jwt-decode";
import { Mail } from "lucide-react";

const CustomerDashboard = () => {
   const token = localStorage.getItem("token");
  const decoded = token ? jwtDecode(token) : null;
  const customerId = decoded?.id;
  const [activeSection, setActiveSection] = useState('calls');
//   const [incomingCall, setIncomingCall] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
//   const [localStream, setLocalStream] = useState(null);
//   const [remoteStream, setRemoteStream] = useState(null);
//   const [roomId, setRoomId] = useState(null);
//   const localVideoRef = React.createRef();
// const remoteVideoRef = React.createRef();

//   const [updateCallStatus] = useUpdateCallStatusMutation();

//   useEffect(() => {
//     const socket = initSocket();
//     joinUserRoom(customerId);

//     onIncomingCall(async ({ roomId, offer, fromUserId }) => {
//       setIncomingCall({ roomId, offer, fromUserId });
//     });

//     onIceCandidate(async (candidate) => {
//       await addIceCandidate(candidate);
//     });

//     setIceCandidateCallback((candidate) => {
//       if (roomId) {
//         socket.emit("ice-candidate", { roomId, candidate });
//       }
//     });
//   }, [roomId]);

//   const handleAccept = async () => {
//     if (!incomingCall) return;

//     const { roomId, offer, fromUserId } = incomingCall;
//     const { peerConnection, remoteStream: rs } = initPeerConnection(localVideoRef, remoteVideoRef);
//     setRemoteStream(rs);

//     const stream = await getMediaStream();
//     setLocalStream(stream);
//     addTracks();

//     await setRemoteDescription(offer);
//     const answer = await createAnswer();

//     sendAnswer({ roomId, answer });
//     setRoomId(roomId);
//     setCallAccepted(true);
//     setIncomingCall(null);

//     // ✅ Update backend that call was accepted
//     try {
//       await updateCallStatus({ roomId, status: "accepted" }).unwrap();
//       console.log("✅ Call status updated to accepted");
//     } catch (err) {
//       console.error("❌ Failed to update call status:", err);
//     }
//   };

//   const handleReject = () => {
//     setIncomingCall(null);
//   };

//   const handleEndCall = async () => {
//     setCallAccepted(false);
//     setRoomId(null);

//     if (localStream) {
//       localStream.getTracks().forEach((track) => track.stop());
//     }

//     try {
//       if (roomId) {
//         await updateCallStatus({ roomId, status: "ended" }).unwrap();
//         console.log("📴 Call ended");
//       }
//     } catch (err) {
//       console.error("❌ Failed to update call status on end:", err);
//     }

//     setLocalStream(null);
//     setRemoteStream(null);
//   };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Section Navigation */}
      <div className="border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="px-4 md:px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveSection('calls')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeSection === 'calls'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Video Calls
            </button>
            <button
              onClick={() => setActiveSection('email')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeSection === 'email'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
          </div>
        </div>
      </div>

      {/* Section Content */}
      {activeSection === 'calls' && (
        <>
          {/* <IncomingCallDialog
            open={!!incomingCall}
            callerName="Agent"
            onAccept={handleAccept}
            onReject={handleReject}
          /> */}

          <VideoCallModal
            // open={callAccepted}
            // onEnd={handleEndCall}
            // localStream={localStream}
            // remoteStream={remoteStream}
            // callAccepted={true}
            // roomId={roomId}
          />
        </>
      )}

      {activeSection === 'email' && (
        <div className="p-2 md:p-6">
          <EmailComponent />
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
