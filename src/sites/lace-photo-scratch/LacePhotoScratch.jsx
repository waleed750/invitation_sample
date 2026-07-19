import React, { useEffect, useRef, useState } from "react";
import { Music, Music2, RotateCcw } from "lucide-react";
import { laceScratchData } from "./data";
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

      <section className={`scratch-envelope ${opened ? "is-open" : ""}`} aria-label="Lace save the date">
        <button className="lace-cover" type="button" onClick={openEnvelope} aria-label="Open save the date">
          <span className="lace-cover__texture" />
          <span className="wax-seal">
            <span>Save</span>
            <span>the</span>
            <span>date</span>
          </span>
          <span className="tap-open">Tap to open</span>
        </button>

        <div className="scratch-stage" aria-hidden={!opened}>
          <div className="scratch-card">
            <div className="scratch-photo" />
            <div className="scratch-content">
              <p>{laceScratchData.event.label}</p>
              <h1>
                {laceScratchData.couple.firstName}
                <span>&</span>
                {laceScratchData.couple.secondName}
              </h1>
              <strong>{laceScratchData.event.date}</strong>
              <small>{laceScratchData.event.location}</small>
            </div>
            <ScratchCanvas />
          </div>
          <p className="scratch-instruction">Scratch to reveal</p>
        </div>
      </section>
    </main>
  );
}

function ScratchCanvas() {
  const canvasRef = useRef(null);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const resizeObserver = new ResizeObserver(() => paintCover(canvas, context));

    resizeObserver.observe(canvas);
    paintCover(canvas, context);

    return () => resizeObserver.disconnect();
  }, []);

  function scratch(event) {
    event.preventDefault();

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const points = "touches" in event ? Array.from(event.touches) : [event];

    context.globalCompositeOperation = "destination-out";
    points.forEach((point) => {
      context.beginPath();
      context.arc(point.clientX - rect.left, point.clientY - rect.top, 34, 0, Math.PI * 2);
      context.fill();
    });

    context.globalCompositeOperation = "source-over";
    if (calculateCleared(canvas, context) > 0.42) setCleared(true);
  }

  function resetScratch() {
    const canvas = canvasRef.current;
    paintCover(canvas, canvas.getContext("2d"));
    setCleared(false);
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`scratch-canvas ${cleared ? "is-cleared" : ""}`}
        onPointerDown={scratch}
        onPointerMove={(event) => {
          if (event.buttons === 1) scratch(event);
        }}
        onTouchStart={scratch}
        onTouchMove={scratch}
        aria-label="Scratch surface"
      />
      <button className="scratch-reset" type="button" onClick={resetScratch} aria-label="Reset scratch card">
        <RotateCcw size={16} />
      </button>
    </>
  );
}

function paintCover(canvas, context) {
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;

  canvas.width = Math.max(1, Math.floor(rect.width * scale));
  canvas.height = Math.max(1, Math.floor(rect.height * scale));
  context.setTransform(scale, 0, 0, scale, 0, 0);

  const gradient = context.createLinearGradient(0, 0, rect.width, rect.height);
  gradient.addColorStop(0, "#dfd0ba");
  gradient.addColorStop(0.45, "#f6eee0");
  gradient.addColorStop(1, "#b99d78");

  context.globalCompositeOperation = "source-over";
  context.fillStyle = gradient;
  context.fillRect(0, 0, rect.width, rect.height);

  context.fillStyle = "rgba(255, 255, 255, 0.38)";
  context.font = "600 13px Georgia";
  context.textAlign = "center";
  context.letterSpacing = "3px";
  context.fillText("SCRATCH TO REVEAL", rect.width / 2, rect.height / 2);

  context.strokeStyle = "rgba(255, 255, 255, 0.24)";
  context.lineWidth = 1;
  for (let x = -rect.height; x < rect.width; x += 22) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + rect.height, rect.height);
    context.stroke();
  }
}

function calculateCleared(canvas, context) {
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let transparent = 0;

  for (let index = 3; index < pixels.length; index += 16) {
    if (pixels[index] < 20) transparent += 1;
  }

  return transparent / (pixels.length / 16);
}
