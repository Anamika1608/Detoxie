import React from "react";
import { TouchableOpacity, Text } from "react-native";

interface CustomButtonProps {
    title: string;
    onPress: () => void;
    bgColor?: string;
    textColor?: string;
    className?: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({
    title,
    onPress,
    bgColor = "bg-[#4C4B7E]",
    textColor = "text-white",
    className = "",
}) => {
    return (
        <TouchableOpacity
            className={`w-[90%] py-4 rounded-full items-center justify-center self-center my-2 ${bgColor} ${className}`}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Text className={`text-xl ${textColor}`}
                style={{ fontFamily: "DMSans-SemiBold" }}>
                {title}
            </Text>
        </TouchableOpacity>
    );
};

export default CustomButton;
