import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wrench, Mail } from 'lucide-react';

export default function DevNoticeBanner() {
  const [open, setOpen] = useState(true);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-md bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-8 text-center"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto mb-5 p-4 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl w-fit">
              <Wrench className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight mb-3">Site em Desenvolvimento</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              O ApexEnem ainda está em desenvolvimento. Algumas funcionalidades podem estar em construção ou apresentar erros.
            </p>
            <div className="p-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2.5">
              <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Encontrou um erro? Reporte em{' '}
                <a href="mailto:apexenem@gmail.com" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">apexenem@gmail.com</a>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition cursor-pointer"
            >
              Entendi, continuar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
