import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-sm text-slate-500 font-mono">
      <p>&copy; {new Date().getFullYear()} <span className="text-slate-900 font-bold">IT_Docs</span>.</p>
    </footer>
  );
}
