import { Calendar, BarChart2, Trophy, Sparkles, Target, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

type IconProps = React.SVGProps<SVGSVGElement>;

export const CalendarIcon = (props: IconProps) => (
  <Calendar className={cn('w-8 h-8 text-primary', props.className)} {...props} />
);
export const ChartIcon = (props: IconProps) => (
  <BarChart2 className={cn('w-8 h-8 text-primary', props.className)} {...props} />
);
export const TrophyIcon = (props: IconProps) => (
  <Trophy className={cn('w-8 h-8 text-primary', props.className)} {...props} />
);
export const SparklesIcon = (props: IconProps) => (
  <Sparkles className={cn('w-8 h-8 text-primary', props.className)} {...props} />
);
export const TargetIcon = (props: IconProps) => (
  <Target className={cn('w-8 h-8 text-primary', props.className)} {...props} />
);
export const TrendingUpIcon = (props: IconProps) => (
  <TrendingUp className={cn('w-4 h-4 text-primary', props.className)} {...props} />
);
export const DollarSignIcon = (props: IconProps) => (
  <DollarSign className={cn('w-4 h-4 text-primary', props.className)} {...props} />
);