import React from "react";
import {
  View,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";
import { DayTimelineView } from "./DayTimelineView";

interface DayTimelineProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  isVisible: boolean;
  onClose: () => void;
}

export function DayTimeline({
  selectedDate,
  onSelectDate,
  isVisible,
  onClose,
}: DayTimelineProps) {
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      supportedOrientations={["portrait"]}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <DayTimelineView
              selectedDate={selectedDate}
              onSelectDate={onSelectDate}
            />
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});

