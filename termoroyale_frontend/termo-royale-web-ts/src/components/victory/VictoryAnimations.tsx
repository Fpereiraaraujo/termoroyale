export function VictoryAnimations() {
    return (
        <style>{`
            @keyframes confetti {
                0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
                100% { transform: translateY(110vh) rotate(720deg); opacity: 0.8; }
            }
            .animate-confetti { animation: confetti linear infinite; }

            @keyframes goldPulse {
                0%, 100% { text-shadow: 0 0 12px rgba(250,204,21,.6), 0 0 32px rgba(250,204,21,.35); }
                50%     { text-shadow: 0 0 24px rgba(250,204,21,.9), 0 0 56px rgba(250,204,21,.55); }
            }
            .gold-pulse { animation: goldPulse 2.2s ease-in-out infinite; }

            @keyframes crownFloat {
                0%, 100% { transform: translateY(0) rotate(-4deg); }
                50%     { transform: translateY(-12px) rotate(4deg); }
            }
            .crown-float { animation: crownFloat 2.4s ease-in-out infinite; }

            @keyframes goatBounce {
                0%, 100% { transform: translateY(0) scale(1); }
                50%     { transform: translateY(-8px) scale(1.08); }
            }
            .goat-bounce { animation: goatBounce 1.6s ease-in-out infinite; }
        `}</style>
    );
}
