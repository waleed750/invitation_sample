import React, { useRef, useState } from "react";
import { Music, Music2 } from "lucide-react";
import { laceScratchData } from "./data";
import ScratchRevealIntro from "../../shared/intros/ScratchRevealIntro.jsx";
import "./styles.css";

export function LacePhotoScratch() {
  const audioRef = useRef(null);
  const [opened, setOpened] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);

  async function openEnvelope() {
    if (opened) return;
    setOpened(true);

    try {
      await audioRef.current?.play();
      setMusicPlaying(true);
    } catch {
      setMusicPlaying(false);
    }
  }

  async function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
        setMusicPlaying(true);
      } catch {
        setMusicPlaying(false);
      }
    } else {
      audio.pause();
      setMusicPlaying(false);
    }
  }

  const revealSection = laceScratchData.sections.find((s) => s.type === "scratchReveal");

  return (
    <main className="scratch-site">
      <audio ref={audioRef} src={laceScratchData.media.musicUrl} loop preload="auto" />

      <button
        className={`scratch-music ${opened ? "is-visible" : ""}`}
        type="button"
        onClick={toggleMusic}
        aria-label={musicPlaying ? "Pause music" : "Play music"}
      >
        {musicPlaying ? <Music2 size={18} /> : <Music size={18} />}
      </button>

      <ScratchRevealIntro
        photoUrl={revealSection.props.photoUrl}
        label={revealSection.props.label}
        firstName={revealSection.props.firstName}
        secondName={revealSection.props.secondName}
        date={revealSection.props.date}
        location={revealSection.props.location}
        isOpen={opened}
        onOpen={openEnvelope}
      />
    </main>
  );
}
