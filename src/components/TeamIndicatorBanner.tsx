import { Card } from './ui/card';

interface TeamIndicatorBannerProps {
  currentPossession: 'ucDavis' | 'opponent';
  activeTeamName: string;
}

export default function TeamIndicatorBanner({
  currentPossession,
  activeTeamName,
}: TeamIndicatorBannerProps) {
  return (
    <Card
      className={`p-4 ${
        currentPossession === 'ucDavis'
          ? 'bg-gradient-to-r from-[#FFBF00] to-[#ffcc33]'
          : 'bg-gradient-to-r from-red-600 to-red-700'
      } border-none`}
    >
      <div className="text-center">
        <h2
          className={`text-2xl ${
            currentPossession === 'ucDavis' ? 'text-[#022851]' : 'text-white'
          }`}
        >
          Now Tracking: {activeTeamName}
        </h2>
        <p
          className={`text-sm ${
            currentPossession === 'ucDavis' ? 'text-[#022851]/70' : 'text-white/70'
          }`}
        >
          Switch possession to track the other team
        </p>
      </div>
    </Card>
  );
}
