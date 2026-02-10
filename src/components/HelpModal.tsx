import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export default function HelpModal({ onClose }: HelpModalProps) {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div
        className="relative bg-gradient-to-b from-machine-panel via-machine-body to-machine-panel border-2 border-chrome-dark rounded-2xl shadow-2xl mx-4 max-w-md w-full max-h-[85vh] flex flex-col"
        initial={{ y: 30, scale: 0.95, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Fixed header with close button */}
        <div className="flex items-center justify-between p-6 sm:p-8 pb-0 sm:pb-0 shrink-0">
          <h2
            className="text-2xl font-title font-bold text-white"
            style={{ textShadow: '0 0 20px rgba(130, 4, 88, 0.6)' }}
          >
            How to Play
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-6 sm:p-8 pt-4 sm:pt-4">
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <section>
            <h3 className="font-semibold text-led-green text-base mb-1">Goal</h3>
            <p>
              Nudge the five dials to make a maths expression that equals the
              <span className="font-bold text-led-green"> target number</span>.
              Solve it in as few moves as possible to earn more coins.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-led-green text-base mb-1">The Dials</h3>
            <p>
              Three <span className="font-semibold text-white">number</span> dials (numbers from 1 to 12)
              alternate with two <span className="font-semibold text-white">operator</span> dials
              (+, −, ×, ÷).
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-led-green text-base mb-1">Spin & Nudge</h3>
            <p>
              Pull the <span className="font-semibold text-red-400">lever</span> to spin.
              The dials land on random positions that don't make the target.
              Use the <span className="font-semibold text-white">arrow buttons</span> to nudge each
              dial up or down. Each nudge = one move.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-led-green text-base mb-1">Order of Operations</h3>
            <p>
              Standard maths rules: × and ÷ before + and −.
            </p>
            <div className="text-center font-mono text-xs text-slate-500 my-1">
              e.g. 5 + 3 × 2 = 5 + 6 = 11, not 16
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-led-green text-base mb-1">Difficulty Modes</h3>
            <div className="space-y-1.5">
              <p>
                <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1.5 align-middle" />
                <span className="font-semibold text-green-400">Easy</span> — all dials lock in place
                when correct. Payout reduced by 2.
              </p>
              <p>
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1.5 align-middle" />
                <span className="font-semibold text-yellow-400">Medium</span> — operator dials
                lock when correct. Payout reduced by 1.
              </p>
              <p>
                <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1.5 align-middle" />
                <span className="font-semibold text-red-400">Hard</span> — no locks, no hints.
                Full payout.
              </p>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Switching to an easier mode mid-game lowers your payout for that round.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-led-amber text-base mb-1" style={{ textShadow: '0 0 6px #ffcc00' }}>
              Scoring
            </h3>
            <p className="mb-2">
              After each spin, the <span className="text-led-green font-semibold">par</span> (minimum
              moves to solve) is shown. Your coin payout depends on how close you get
              and your difficulty mode:
            </p>
            <div className="bg-black/40 rounded-lg border border-chrome-dark p-3 font-mono text-xs">
              <table className="w-full">
                <thead>
                  <tr className="text-slate-500">
                    <th className="text-left font-normal pb-1.5">Moves</th>
                    <th className="text-center font-normal pb-1.5 text-red-400">Hard</th>
                    <th className="text-center font-normal pb-1.5 text-yellow-400">Medium</th>
                    <th className="text-center font-normal pb-1.5 text-green-400">Easy</th>
                  </tr>
                </thead>
                <tbody className="text-led-amber font-bold">
                  <tr>
                    <td className="text-slate-400 font-normal py-0.5">Par</td>
                    <td className="text-center">ñ5</td>
                    <td className="text-center">ñ4</td>
                    <td className="text-center">ñ3</td>
                  </tr>
                  <tr>
                    <td className="text-slate-400 font-normal py-0.5">+1–2</td>
                    <td className="text-center">ñ4</td>
                    <td className="text-center">ñ3</td>
                    <td className="text-center">ñ2</td>
                  </tr>
                  <tr>
                    <td className="text-slate-400 font-normal py-0.5">+3–5</td>
                    <td className="text-center">ñ3</td>
                    <td className="text-center">ñ2</td>
                    <td className="text-center">ñ1</td>
                  </tr>
                  <tr>
                    <td className="text-slate-400 font-normal py-0.5">+6–9</td>
                    <td className="text-center">ñ2</td>
                    <td className="text-center">ñ1</td>
                    <td className="text-center">ñ1</td>
                  </tr>
                  <tr>
                    <td className="text-slate-400 font-normal py-0.5">10+</td>
                    <td className="text-center">ñ1</td>
                    <td className="text-center">ñ1</td>
                    <td className="text-center">ñ1</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Maximum: ñ25 across all 5 challenges.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-led-green text-base mb-1">Re-spin</h3>
            <p>
              Stuck? Pull the lever again for a new starting position. Same puzzle, different
              starting dials.
            </p>
          </section>

          <div className="pt-3 border-t border-white/10 text-xs text-slate-500">
            Each puzzle has exactly 1 solution. There are 5 new challenges to complete each day. Good luck!
          </div>
        </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
