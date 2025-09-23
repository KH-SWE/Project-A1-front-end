import { Tabs } from 'expo-router';
import TabBarIcon from '@/components/TabBarIcon';

import HomeIcon from '@/assets/icons/house.svg';
import HomeIconFilled from '@/assets/icons/house-filled.svg';

import ClubsIcon from '@/assets/icons/clubs.svg';
import ClubsIconFilled from '@/assets/icons/clubs-filled.svg';

import SpacesIcon from '@/assets/icons/building.svg';
import SpacesIconFilled from '@/assets/icons/building-filled.svg';

import ProfileIcon from '@/assets/icons/user.svg';
import ProfileIconFilled from '@/assets/icons/user-filled.svg';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size}
              FilledIcon={HomeIconFilled}
              OutlineIcon={HomeIcon}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="clubs"
        options={{
          title: 'Clubs',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size}
              FilledIcon={ClubsIconFilled}
              OutlineIcon={ClubsIcon}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="spaces"
        options={{
          title: 'Spaces',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size}
              FilledIcon={SpacesIconFilled}
              OutlineIcon={SpacesIcon}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              focused={focused}
              color={color}
              size={size}
              FilledIcon={ProfileIconFilled}
              OutlineIcon={ProfileIcon}
            />
          ),
        }}
      />
    </Tabs>
  );
}
