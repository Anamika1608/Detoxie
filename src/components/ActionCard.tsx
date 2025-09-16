import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ui/ThemedText';

const ActionCard = ({
    title = 'string',
    description = 'string',
    backgroundColor = '#FCD34D',
    onPress = () => {},
    style = undefined as any, 
}) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            className={`rounded-2xl p-4 mx-4 mb-4 border-black`}
            style={[
                {
                    backgroundColor,
                    shadowColor: '#000',
                    
                    shadowOffset: {
                        width: 0,
                        height: 2,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 5,
                    elevation: 5,
                },
                style
            ]}
            activeOpacity={0.8}
        >
            <Text className="text-lg text-gray-800 mb-2"
                style={{ fontFamily: 'YoungSerif-Regular' }}>
                {title}
            </Text>
            <ThemedText className="text-sm text-gray-700 leading-5">
                {description}
            </ThemedText>
        </TouchableOpacity>
    );
};

export default ActionCard;