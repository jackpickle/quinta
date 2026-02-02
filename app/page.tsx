"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { HowToPlayModal } from "@/components/organisms/HowToPlayModal";
import { PasswordGate } from "@/components/organisms/PasswordGate";
import { createLobby, joinLobby } from "@/lib/firebase/lobby";
import { getPlayerId, savePlayerName } from "@/lib/firebase/player-identity";

export default function HomePage() {
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isVerified = sessionStorage.getItem('quinta_password_verified') === 'true';
    setVerified(isVerified);
    setChecking(false);
  }, []);

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const code = await createLobby(playerName.trim());
      router.push(`/lobby/${code}`);
    } catch {
      setError("Failed to create game. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!roomCode.trim()) {
      setError("Please enter a room code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const playerId = getPlayerId();
      savePlayerName(playerName.trim());
      const result = await joinLobby(
        roomCode.trim().toUpperCase(),
        playerId,
        playerName.trim()
      );

      if (result.success) {
        router.push(`/lobby/${roomCode.trim().toUpperCase()}`);
      } else {
        setError(result.error || "Failed to join game");
      }
    } catch {
      setError("Failed to join game. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-brown-light">Loading...</p>
      </div>
    );
  }

  if (!verified) {
    return <PasswordGate onSuccess={() => setVerified(true)} />;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="animate-fade-in mb-8">
        <h1 className="font-[family-name:var(--font-fraunces)] text-[clamp(4rem,15vw,8rem)] font-light tracking-tight text-brown leading-none relative">
          Quinta
        </h1>
        <p className="font-[family-name:var(--font-fraunces)] italic text-brown-light text-[clamp(0.875rem,2.5vw,1.125rem)] mt-4 max-w-xs mx-auto">
          Play it Natural to stay in the game, or aim Higher to take the lead.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        {!showCreateForm && !showJoinForm && (
          <>
            <Button
              variant="secondary"
              className="w-full animate-fade-in-delay-1"
              onClick={() => setShowCreateForm(true)}
            >
              Create Game
            </Button>
            <Button
              variant="secondary"
              className="w-full animate-fade-in-delay-2"
              onClick={() => setShowJoinForm(true)}
            >
              Join Game
            </Button>
            <Button
              variant="ghost"
              className="w-full animate-fade-in-delay-3"
              onClick={() => setShowHowToPlay(true)}
            >
              How to Play
            </Button>
          </>
        )}

        {showCreateForm && (
          <div className="space-y-4 animate-fade-in">
            <Input
              label="Your Name"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleCreateGame}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Game"}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setShowCreateForm(false);
                setError("");
              }}
            >
              Back
            </Button>
          </div>
        )}

        {showJoinForm && (
          <div className="space-y-4 animate-fade-in">
            <Input
              label="Your Name"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <Input
              label="Room Code"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleJoinGame}
              disabled={loading}
            >
              {loading ? "Joining..." : "Join Game"}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setShowJoinForm(false);
                setError("");
              }}
            >
              Back
            </Button>
          </div>
        )}
      </div>

      <footer className="mt-auto pt-12">
        <p className="text-xs text-brown-light">A game of fives</p>
      </footer>

      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />
    </main>
  );
}