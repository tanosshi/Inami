import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { COLORS } from "../../constants/theme";
import { styles } from "./styles";

type ImportUrlModalProps = {
  show: boolean;
  onClose: () => void;
  importUrl: string;
  setImportUrl: (value: string) => void;
  importTitle: string;
  setImportTitle: (value: string) => void;
  importing: boolean;
  onImport: () => void;
};

export function ImportUrlModal({
  show,
  onClose,
  importUrl,
  setImportUrl,
  importTitle,
  setImportTitle,
  importing,
  onImport,
}: ImportUrlModalProps) {
  return (
    <Modal
      visible={show}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Import from URL</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="link"
              size={24}
              color={COLORS.onSurfaceVariant}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Enter MP3 URL (YT soon)"
              placeholderTextColor={COLORS.onSurfaceVariant}
              value={importUrl}
              onChangeText={setImportUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="title"
              size={24}
              color={COLORS.onSurfaceVariant}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Title (optional)"
              placeholderTextColor={COLORS.onSurfaceVariant}
              value={importTitle}
              onChangeText={setImportTitle}
            />
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalButtonOutline}
              onPress={onClose}
            >
              <Text style={styles.modalButtonOutlineText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButtonFilled}
              onPress={onImport}
              disabled={importing}
            >
              {importing ? (
                <ActivityIndicator size="small" color={COLORS.onPrimary} />
              ) : (
                <Text style={styles.modalButtonFilledText}>Import</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type FolderScanModalProps = {
  show: boolean;
  scanProgress: { current: number; total: number };
};

export function FolderScanModal({ show, scanProgress }: FolderScanModalProps) {
  return (
    <Modal
      visible={show}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Importing Music</Text>
          <View style={styles.progressContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.progressText}>
              Processing {scanProgress.current} of {scanProgress.total} files...
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
