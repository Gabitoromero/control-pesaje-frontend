import React from 'react';
import { motion } from 'motion/react';

/**
 * 2D scale animation shown while the 3D scene loads, when WebGL is
 * unavailable, or if the scene fails. The icon drops in with a spring
 * bounce while the scale assembles itself and squashes on impact.
 */
const BalanzaFallback: React.FC = () => (
  <motion.div
    initial={{ y: -40, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 140, damping: 12, delay: 0.1 }}
  >
    <motion.div
      className="w-24 h-24 bg-brand rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-black/30"
      initial={{ rotate: -8 }}
      animate={{ rotate: 0 }}
      transition={{ type: 'spring', stiffness: 90, damping: 7, delay: 0.5 }}
    >
      <img src="/android-chrome-192x192.png" alt="Controlador de Pesaje" className="w-12 h-12 object-contain rounded-xl" />
    </motion.div>
    <svg viewBox="0 0 160 50" className="w-32 h-10 mx-auto mt-2" aria-hidden="true">
      <motion.rect
        x="45" y="34" width="70" height="8" rx="3"
        className="fill-brand/25"
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        initial={{ opacity: 0, scaleX: 0.6 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.35, duration: 0.3 }}
      />
      <motion.rect
        x="65" y="18" width="30" height="18" rx="2"
        className="fill-brand/25"
        style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ delay: 0.45, duration: 0.25 }}
      />
      <motion.rect
        x="10" y="10" width="140" height="10" rx="4"
        className="fill-brand/40"
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        initial={{ opacity: 0, scaleY: 0.4 }}
        animate={{ opacity: 1, scaleY: [0.4, 1, 0.75, 1] }}
        transition={{ delay: 0.55, duration: 0.45, times: [0, 0.35, 0.7, 1] }}
      />
    </svg>
  </motion.div>
);

export default BalanzaFallback;
