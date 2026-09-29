"use client";

import React, { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import "../styles/scratch-reveal-intro.css";
import {useTranslations} from 'next-intl';
import type {SectionProps} from '../types';
import {useInvitationText} from '../InvitationLocaleContext';
type Props = SectionProps<'scratchReveal'> & {
  isOpen: boolean; onOpen: () => void; onRevealed?: () => void;
};

export default function ScratchRevealIntro({
  sealWords,
  tapLabel,
  scratchLabel,
  label,
  firstName,
  secondName,
  date,
  location,
  isOpen,
  onOpen,
  photoUrl,
  onRevealed,
}: Props) {
  const text = useInvitationText();
  const t = useTranslations('engine');
  return (
    <section className={`scratch-envelope ${isOpen ? "is-open" : ""}`} aria-label={t("saveDate")}>
      <button className="lace-cover" type="button" onClick={onOpen} aria-label={text(tapLabel ?? t("openInvitation"))}>
        <span className="lace-cover__texture" />
        <span className="wax-seal">
          {(sealWords ?? [t("sealSave"), t("sealThe"), t("sealDate")]).map((word, i) => (
            <span key={i}>{text(word)}</span>
          ))}
        </span>
        <span className="tap-open">{text(tapLabel ?? t("tapOpen"))}</span>
      </button>

      <div className="scratch-stage" aria-hidden={!isOpen} inert={!isOpen}>
        <div className="scratch-card">
          <div className="scratch-photo" style={{backgroundImage: `url(${JSON.stringify(photoUrl)})`, backgroundSize: "cover", backgroundPosition: "center"}} />
          <div className="scratch-content">
            <p>{text(label)}</p>
            <h1>
              {text(firstName)}
              <span>&amp;</span>
              {text(secondName)}
            </h1>
            <strong>{text(date)}</strong>
            <small>{text(location)}</small>
          </div>
          <ScratchCanvas label={text(scratchLabel ?? t("scratchReveal"))} onRevealed={onRevealed} />
        </div>
        <p className="scratch-instruction">{text(scratchLabel ?? t("scratchReveal"))}</p>
      </div>
    </section>
  );
}

function ScratchCanvas({label, onRevealed}: {label: string; onRevealed?: () => void}) {
  const t = useTranslations('engine');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const resizeObserver = new ResizeObserver(() => paintCover(canvas, context, label));

    resizeObserver.observe(canvas);
    paintCover(canvas, context, label);

    return () => resizeObserver.disconnect();
  }, [label]);

  function scratch(event: React.PointerEvent<HTMLCanvasElement>) {
    event.preventDefault();

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const rect = canvas.getBoundingClientRect();
    const points = [event];

    context.globalCompositeOperation = "destination-out";
    points.forEach((point) => {
      context.beginPath();
      context.arc(point.clientX - rect.left, point.clientY - rect.top, 34, 0, Math.PI * 2);
      context.fill();
    });

    context.globalCompositeOperation = "source-over";
    if (calculateCleared(canvas, context) > 0.42) { setCleared(true); onRevealed?.(); }
  }

  function resetScratch() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    paintCover(canvas, context, label);
    setCleared(false);
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`scratch-canvas ${cleared ? "is-cleared" : ""}`}
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); scratch(event); }}
        onPointerMove={(event) => {
          if (event.buttons === 1) scratch(event);
        }}
        aria-label={t("scratchSurface")}
      />
      <button className="scratch-reset" type="button" onClick={resetScratch} aria-label={t("resetScratch")}>
        <RotateCcw size={16} />
      </button>
    </>
  );
}

function paintCover(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, label: string) {
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
  context.fillText(label, rect.width / 2, rect.height / 2);

  context.strokeStyle = "rgba(255, 255, 255, 0.24)";
  context.lineWidth = 1;
  for (let x = -rect.height; x < rect.width; x += 22) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + rect.height, rect.height);
    context.stroke();
  }
}

function calculateCleared(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let transparent = 0;

  for (let index = 3; index < pixels.length; index += 16) {
    if (pixels[index] < 20) transparent += 1;
  }

  return transparent / (pixels.length / 16);
}
