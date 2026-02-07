"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameState } from "@/hooks/useGameState";
import { usePlayerIdentity } from "@/hooks/usePlayerIdentity";
import { useValidMoves } from "@/hooks/useValidMoves";
import { usePresence } from "@/hooks/usePresence";
import { usePrivateHand } from "@/hooks/usePrivateHand";
import { GameBoard } from "@/components/organisms/GameBoard";
import { Sidebar } from "@/components/organisms/Sidebar";
import { WinScreen } from "@/components/organisms/WinScreen";
import { TurnIndicator } from "@/components/molecules/TurnIndicator";
import { ScoreDisplay } from "@/components/molecules/ScoreDisplay";
import { TurnLog } from "@/components/molecules/TurnLog";
import { Button } from "@/components/atoms/Button";
import { executePlayerTurn } from "@/lib/firebase/game-actions";
import { resetToLobby } from "@/lib/firebase/lobby";
import { checkWinner } from "@/lib/game";
import type { TurnAction } from "@/types/game";
import { playChipPlace, playCardLift, playPass as playPassSound, playWin, playYourTurn } from "@/lib/sounds";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;

  const { gameState, loading, error } = useGameState(roomCode);
  const { playerId, initialized } = usePlayerIdentity();
  const { validMoves, selectedCardId, selectCard, clearSelection } =
    useValidMoves(roomCode);
  const { hand } = usePrivateHand(roomCode, playerId);

  // Initialize presence tracking
  usePresence(roomCode, playerId);

  // Track previous turn index to detect turn changes
  const prevTurnRef = useRef<number | null>(null);

  // Sound: your turn notification
  const currentTurnIndex = gameState?.currentPlayerIndex ?? null;
  const gameStatus = gameState?.status;
  const currentTurnPlayerId = gameState?.players[gameState?.currentPlayerIndex ?? 0]?.id;

  useEffect(() => {
    if (gameStatus !== 'playing' || currentTurnIndex === null) return;
    const prevTurn = prevTurnRef.current;
    prevTurnRef.current = currentTurnIndex;
    if (prevTurn === null) return;
    if (prevTurn !== currentTurnIndex && currentTurnPlayerId === playerId) {
      playYourTurn();
    }
  }, [currentTurnIndex, gameStatus, currentTurnPlayerId, playerId]);

  // Sound: win celebration
  useEffect(() => {
    if (gameState?.status === 'finished' && gameState.winner) {
      playWin();
    }
  }, [gameState?.status, gameState?.winner]);

  // Redirect to lobby if game was reset
  useEffect(() => {
    if (!loading && gameState && (!gameState.board || gameState.status === "waiting")) {
      router.push(`/lobby/${roomCode}`);
    }
  }, [gameState, loading, router, roomCode]);

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-brown-light">Loading game...</p>
      </div>
    );
  }

  if (error || !gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-brown-light">{error || "Game not found"}</p>
        <Button onClick={() => router.push("/")}>Back to Home</Button>
      </div>
    );
  }

  // Show loading while redirecting
  if (!gameState.board || gameState.status === "waiting") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-brown-light">Returning to lobby...</p>
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === playerId;

  // Show all valid moves (Natural + Higher combined)
  const displayValidMoves = [...validMoves.natural, ...validMoves.higher];

  const handleCellClick = async (cellNumber: number) => {
    console.log('🎯 Cell clicked:', cellNumber);
    console.log('   My turn?', isMyTurn);
    console.log('   Selected card?', selectedCardId);
    
    if (!isMyTurn || !selectedCardId) return;
    
    const card = hand.find(c => c.id === selectedCardId);
    console.log('🃏 Card found:', card);
    
    if (!card) return;
    
    let action: TurnAction;
    if (card.value === cellNumber) {
      action = 'natural';
    } else if (cellNumber > card.value) {
      action = 'higher';
    } else {
      console.log('❌ Invalid move - cell not higher than card');
      return;
    }
    
    console.log('✅ Executing turn:', { action, cellNumber, cardValue: card.value });
    
    const result = await executePlayerTurn(
      roomCode,
      playerId,
      action,
      selectedCardId,
      cellNumber,
    );
    
    console.log('📥 Turn result:', result);

    if (result.success) playChipPlace();
    clearSelection();
  };

  const handlePass = async () => {
    if (!isMyTurn) return;
    playPassSound();
    await executePlayerTurn(roomCode, playerId, "pass");
    clearSelection();
  };

  // Check for winner
  if (gameState.status === "finished" && gameState.winner) {
    const winner = gameState.players.find((p) => p.id === gameState.winner);
    const winCheck = checkWinner(gameState.board, gameState.settings.winLength);
    const winningCells = winCheck.winningLine
      ? winCheck.winningLine.cells.map((c) => c.number)
      : [];

    // For team wins, find all teammates (same color)
    const teamMembers = winner && gameState.settings.teamsEnabled
      ? gameState.players.filter((p) => p.color === winner.color)
      : undefined;

    // isWinner: in team mode, check if player is on the winning team
    const isWinner = teamMembers
      ? teamMembers.some((p) => p.id === playerId)
      : gameState.winner === playerId;

    const handlePlayAgain = async () => {
      await resetToLobby(roomCode);
      router.push(`/lobby/${roomCode}`);
    };

    return (
      <WinScreen
        winner={winner!}
        board={gameState.board}
        winningCells={winningCells}
        isWinner={isWinner}
        onPlayAgain={handlePlayAgain}
        onNewGame={() => router.push("/")}
        teamMembers={teamMembers}
      />
    );
  }

  // Action hint for turn indicator
  const actionHint = selectedCardId ? "Select a cell" : "Select a card";

  return (
    <div className="flex flex-col h-[100dvh] md:h-screen overflow-hidden">
      {/* Header */}
      <header className="shrink-0 bg-wood-light border-b border-wood">
        <div className="flex justify-between items-center px-3 py-2 max-w-md mx-auto">
          <TurnIndicator
            playerName={currentPlayer?.name || "Unknown"}
            playerColor={currentPlayer?.color || "coral"}
            isMyTurn={isMyTurn}
            actionHint={isMyTurn ? actionHint : undefined}
          />
          <ScoreDisplay players={gameState.players} board={gameState.board} />
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Left sidebar with turn log on desktop */}
        <div className="hidden md:flex md:flex-col md:justify-center md:w-48 lg:w-52 shrink-0 bg-wood-light border-r border-wood p-3">
          <TurnLog entries={gameState.turnHistory || []} />
        </div>

        {/* Board container */}
        <div className="flex-1 flex items-center justify-center p-2 md:p-4 min-h-0">
          <GameBoard
            board={gameState.board}
            validMoves={displayValidMoves}
            onCellClick={handleCellClick}
            disabled={!isMyTurn || !selectedCardId}
          />
        </div>

        {/* Sidebar with hand and pass button */}
        <Sidebar
          hand={hand}
          selectedCardId={selectedCardId}
          onCardSelect={(cardId: string) => { playCardLift(); selectCard(cardId); }}
          onPass={handlePass}
          disabled={!isMyTurn}
          playerColor={currentPlayer?.color}
          maxCards={gameState.settings.handSize}
        />
      </div>
    </div>
  );
}