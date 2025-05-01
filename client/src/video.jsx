import React, { useState, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { UserContext } from "./UserContext";
import { ToastContainer, toast } from "react-toastify";
import Hangup from "./assets/hangup.png";


export default function Video() {
  const { offerHandler,offer,accept,onlineUsers, id, receiverId, callTime,callerId } = useContext(UserContext);
  const sourceRef = useRef(null);
  const targetRef = useRef(null);
  const [offerReceived, setOfferReceived] = useState(false);

  const pc = useRef(null);
  const socket = useRef(null);

  const configuration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  };

  useEffect(() => {
    console.log("[Video.jsx] useEffect triggered with id:", id, "receiverId:", receiverId);

    // 1) Initialize socket and peer connection
    socket.current = io("https://beastmode-main.onrender.com/signaling");
    socket.current.emit("register", id);
    console.log("[Socket] Connected to signaling server");

    pc.current = new RTCPeerConnection(configuration);
    console.log("[PeerConnection] Created RTCPeerConnection instance");



    const handleRemoteOffer = async () => {
 
        try {
          await pc.current.setRemoteDescription(new RTCSessionDescription(offerHandler));
        } catch (error) {
          console.error("Error setting remote description:", error);
        }
      
    };
    

    const handleAnswer = async () => {
      try {
        const answer = await pc.current.createAnswer(); 
        await pc.current.setLocalDescription(answer);
    
        socket.current.emit("answer", {
          to: callerId,
          from: id,
          answer: {
            type: "answer", 
            sdp: answer.sdp
          }
        });
    
        console.log("Answer SDP:", answer.sdp);
      } catch (error) {
        console.error("Error while creating or sending answer:", error);
      }
    };
    
   
   
    

    if (offer && offerHandler) {
      handleRemoteOffer();
    }
    
    pc.current.onicecandidate = (event) => {
      console.log("[PeerConnection] onicecandidate event:", event);
      if (event.candidate) {
        console.log("[PeerConnection] Sending new ICE candidate to server:", event.candidate);
        socket.current.emit("new-ice-candidate", event.candidate, receiverId);
      }
    };


    // 3) Remote track event
    pc.current.ontrack = (event) => {
      console.log("[PeerConnection] ontrack event:", event);
      if (targetRef.current) {
        targetRef.current.srcObject = event.streams[0];
        console.log("[Video] Attached remote stream to target video element");
      }
    };


    // 4) Get local media and add tracks
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        console.log("[MediaDevices] Local media stream obtained:", stream);
        if (sourceRef.current) {
          sourceRef.current.srcObject = stream;
          console.log("[Video] Attached local stream to source video element");
        }
        stream.getTracks().forEach((track) => {
          pc.current.addTrack(track, stream);
          console.log("[PeerConnection] Added local track to peer connection:", track);
        });


 
        if(accept && offer){
          console.log('The accept is true we found it and we created an answer');
          handleAnswer(); 
        }


      })
      .catch((error) => {
        console.error("[MediaDevices] Error accessing camera/mic:", error);
        toast.error("Error accessing camera/mic");
      });



    socket.current.on("hangup", () => {
      console.log("[Socket] Received 'hangup' event");
      hangUpCall();
    });

    return () => {
      console.log("[Video.jsx] Cleaning up socket and peer on unmount");
      socket.current?.disconnect();
      pc.current?.close();
    };

  }, [id, receiverId]);

  useEffect(() => {
    if (callTime && callerId === null) { 
      console.log("[Video.jsx] callTime changed, initiating createOffer");
      createOffer();
    }


 
     socket.current.on("answer", async ({ answer }) => {
      console.log("[Socket] Received answer:", answer);
      const sessionDescription = new RTCSessionDescription(answer);
      await pc.current.setRemoteDescription(sessionDescription);
     });
    
    
    // Receiving new ICE candidate (for both sides)
    socket.current.on("new-ice-candidate", async (candidate) => {
      console.log("[Socket] Received ICE candidate:", candidate);
      try {
        await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("[WebRTC] Added ICE candidate to peer connection");
      } catch (e) {
        console.error("[WebRTC] Error adding received ICE candidate:", e);
      }
    });



  }, [callTime]);


  const createOffer = async () => {
    console.log("[createOffer] Attempting to create offer");

    if (!receiverId) {
      console.error("[createOffer] No receiver ID provided");
      toast.error("No receiver ID provided");
      return;
    }

    try {
      const offer = await pc.current.createOffer(); 
      console.log("[createOffer] Offer created:", offer);

      await pc.current.setLocalDescription(offer);
      console.log("[createOffer] Local description set with offer");

      socket.current.emit("offer", { offer, to: receiverId, from: id });

      console.log("[Socket] Emitted 'offer' to receiverId:", receiverId);
    } catch (error) {
      console.error("[createOffer] Error creating or sending offer:", error);
      toast.error("Error creating offer");
    }
  };



  const hangUpCall = () => {
    console.log("[hangUpCall] Hanging up the call");

    const stream = sourceRef.current?.srcObject;
    if (stream) {
      console.log("[hangUpCall] Stopping all local tracks");
      stream.getTracks().forEach((t) => t.stop());
    }

    if (pc.current) {
      console.log("[hangUpCall] Closing peer connection");
      pc.current.close();
    }

    if (sourceRef.current) {
      console.log("[hangUpCall] Clearing source video");
      sourceRef.current.srcObject = null;
    }
    if (targetRef.current) {
      console.log("[hangUpCall] Clearing target video");
      targetRef.current.srcObject = null;
    }

    if (socket.current) {
      console.log("[hangUpCall] Emitting 'hangup' to server");
      socket.current.emit("hangup", receiverId);
    }
  };

  return (
    <div className="targetRTC">
      <video
        className="streamTarget"
        autoPlay
        playsInline
        ref={targetRef}
        muted
      />
      <div className="sourceRTC">
        <video
          className="streamSource"
          autoPlay
          playsInline
          muted
          ref={sourceRef}
        />
      </div>

      {offerReceived && (
        <div className="offerControls">
          <button onClick={() => setOfferReceived(false)}>Decline</button>
        </div>
      )}

      <button className="hangupDiv" onClick={hangUpCall}>
        <img src={Hangup} alt="Hang up" />
      </button>

      <ToastContainer />
    </div>
  );
}
