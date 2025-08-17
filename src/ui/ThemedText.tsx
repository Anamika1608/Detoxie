import React from "react";
import { Text, TextProps } from "react-native";

export const ThemedText: React.FC<TextProps> = ({ style, children, ...props }) => {
  return (
    <Text style={[{ fontFamily: "DMSans-SemiBold" }, style]} {...props}>
      {children}
    </Text>
  );
};
