import React from 'react';
import { SvgProps } from 'react-native-svg';

type Props = {
  focused: boolean;
  color: string;
  size: number;
  FilledIcon: React.FC<SvgProps>;
  OutlineIcon: React.FC<SvgProps>;
};

export default function TabBarIcon({ focused, color, size, FilledIcon, OutlineIcon }: Props) {
  const Icon = focused ? FilledIcon : OutlineIcon;
  return <Icon width={size} height={size} fill={color} />;
}
