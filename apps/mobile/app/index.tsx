import React from 'react';
import { ScrollView, Text, View } from 'react-native';

const cards = [
  ['오늘 ABX', '컴뱃 / 여성 / 영웅', '추천 조합 3개'],
  ['오늘 ABL', '유니버셜 / 빌런 / 보스딜', '내 계정 반영'],
  ['커스텀 조합', '딜러 + 리더 + 서포터', '점수 breakdown'],
  ['캐릭터 DB', '이미지 / 아티팩트 / 스킬 / 유니폼', '검색·필터']
];

export default function MobileHome() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 18, gap: 14 }}>
      <View style={{ paddingTop: 32, paddingBottom: 10 }}>
        <Text style={{ fontSize: 13, color: '#7c3aed', fontWeight: '900' }}>MFF DATA HUB</Text>
        <Text style={{ fontSize: 30, fontWeight: '900', color: '#0f172a', marginTop: 4 }}>개인 메타 분석</Text>
        <Text style={{ fontSize: 14, color: '#64748b', marginTop: 6, fontWeight: '700' }}>웹앱과 같은 Supabase DB / 공용 추천엔진을 쓰도록 설계한 iOS 확장 쉘.</Text>
      </View>

      {cards.map(([title, subtitle, badge]) => (
        <View key={title} style={{ backgroundColor: 'white', borderRadius: 28, padding: 18, borderWidth: 1, borderColor: '#e2e8f0' }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a' }}>{title}</Text>
          <Text style={{ fontSize: 13, color: '#64748b', marginTop: 6, fontWeight: '700' }}>{subtitle}</Text>
          <Text style={{ alignSelf: 'flex-start', marginTop: 14, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: '#ede9fe', color: '#6d28d9', fontWeight: '900' }}>{badge}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
