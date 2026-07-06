import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CITY_LIST } from "./cities";
import type { Settings } from "./settings";
import type { Tier } from "./tiers";

const WARN_OPTIONS: { tier: Tier | null; label: string; detail: string }[] = [
  { tier: 3, label: "Moderate and above", detail: "Warn at ~45+ offenses per 1,000/yr" },
  { tier: 4, label: "High and above", detail: "Warn at ~65+ offenses per 1,000/yr" },
  { tier: 5, label: "Highest only", detail: "Warn at ~100+ offenses per 1,000/yr" },
  { tier: null, label: "Never", detail: "No entry warnings" },
];

function Row({
  label,
  detail,
  selected,
  onPress,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!detail && <Text style={styles.rowDetail}>{detail}</Text>}
      </View>
      <Text style={[styles.check, !selected && styles.checkHidden]}>✓</Text>
    </Pressable>
  );
}

export default function SettingsScreen({
  visible,
  settings,
  onChange,
  onClose,
}: {
  visible: boolean;
  settings: Settings;
  onChange: (settings: Settings) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>Done</Text>
          </Pressable>
        </View>
        <ScrollView>
          <Text style={styles.sectionTitle}>City</Text>
          <View style={styles.section}>
            {CITY_LIST.map((city) => (
              <Row
                key={city.id}
                label={city.name}
                detail={`${city.collection.features.length} neighborhoods`}
                selected={settings.cityId === city.id}
                onPress={() => onChange({ ...settings, cityId: city.id })}
              />
            ))}
          </View>
          <Text style={styles.sectionTitle}>Warn when entering</Text>
          <View style={styles.section}>
            {WARN_OPTIONS.map((opt) => (
              <Row
                key={String(opt.tier)}
                label={opt.label}
                detail={opt.detail}
                selected={settings.warnTier === opt.tier}
                onPress={() => onChange({ ...settings, warnTier: opt.tier })}
              />
            ))}
          </View>
          <Text style={styles.footnote}>
            Tiers are indicative bands of reported Part I offenses per 1,000
            residents per year — rough orientation, not a precise safety score.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  close: { fontSize: 17, color: "#007aff" },
  sectionTitle: {
    fontSize: 13,
    color: "#6d6d72",
    textTransform: "uppercase",
    marginTop: 24,
    marginBottom: 6,
    marginHorizontal: 16,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5ea",
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 16 },
  rowDetail: { fontSize: 12, color: "#8e8e93", marginTop: 1 },
  check: { fontSize: 17, color: "#007aff", fontWeight: "600", marginLeft: 8 },
  checkHidden: { opacity: 0 },
  footnote: {
    fontSize: 12,
    color: "#8e8e93",
    margin: 16,
    marginTop: 12,
    marginBottom: 40,
  },
});
