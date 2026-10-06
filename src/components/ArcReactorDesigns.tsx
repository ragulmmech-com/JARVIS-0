import React from "react";
import { motion } from "motion/react";

// Base props for all designs
export interface DesignProps {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  glowColor: string;
  pulseSpeed: number;
}
