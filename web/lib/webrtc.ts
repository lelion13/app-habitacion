export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
];

export async function acquireLocalMedia(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: true,
  });
}

export function stopMediaStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

export function createPeerConnection(handlers: {
  onRemoteStream: (stream: MediaStream) => void;
  onIceCandidate: (candidate: RTCIceCandidateInit) => void;
}): RTCPeerConnection {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  pc.ontrack = (event) => {
    const [stream] = event.streams;
    if (stream) handlers.onRemoteStream(stream);
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      handlers.onIceCandidate(event.candidate.toJSON());
    }
  };

  return pc;
}

export function attachLocalTracks(
  pc: RTCPeerConnection,
  stream: MediaStream,
): void {
  for (const track of stream.getTracks()) {
    pc.addTrack(track, stream);
  }
}

export function closePeerConnection(pc: RTCPeerConnection | null): void {
  if (!pc) return;
  pc.ontrack = null;
  pc.onicecandidate = null;
  pc.close();
}
