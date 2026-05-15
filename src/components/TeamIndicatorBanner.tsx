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
          className={`text-xl ${
            currentPossession === 'ucDavis' ? 'text-[#022851]' : 'text-white'
          }`}
        >
          {activeTeamName} Possession
        </h2>
      </div>
    </Card>
  );
}
