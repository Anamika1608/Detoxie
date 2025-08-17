import React from "react";
import { TouchableOpacity, Text } from "react-native";

interface CustomButtonProps {
    title: string;
    onPress: () => void;
    bgColor?: string;
    textColor?: string;
    className?: string;
    disabled?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
    title,
    onPress,
    bgColor = "#4C4B7E", 
    textColor = "#FFFFFF", 
    className = "",
    disabled = false,
}) => {

    return (
        <TouchableOpacity
            style={[
                {
                    backgroundColor: disabled ? "#807fb3" : bgColor,
                }
            ]}
            className={`w-[90%] py-4 rounded-full items-center justify-center self-center my-2 ${className}`}
            onPress={disabled ? undefined : onPress}
            activeOpacity={disabled ? 1 : 0.8}
            disabled={disabled}
        >
            <Text
                className={`text-xl`}
                style={{
                    fontFamily: "DMSans-SemiBold",
                    color: disabled ? '#D1D5DB' : textColor 
                }}
            >
                {title}
            </Text>
        </TouchableOpacity>
    );
};

export default CustomButton;