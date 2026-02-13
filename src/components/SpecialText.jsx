import useConfig from "../hooks/useConfig";
import { Text } from "react-native";
import { useMemo } from "react";



function BionicText({ children, style, servicePreferences }) {

    const renderedText = useMemo(() => {
        if (!servicePreferences.bionicText) return children;

        const words = children.split(' ');

        return words.map((word, index) => {
            const boldLength = Math.min(4, Math.ceil(word.length * 0.4));

            return (
                <Text key={index}>
                    <Text style={{ fontWeight: 'bold' }}>
                        {word.slice(0, boldLength)}
                    </Text>
                    {word.slice(boldLength)}
                    {index < words.length - 1 ? ' ' : ''}
                </Text>
            );
        });
    }, [children, servicePreferences.bionicText]);

    return (
        <Text style={style}>
            {renderedText}
        </Text>
    );
}

export default function SpecialText({ children, style }) {


    if (children === null || children === undefined) {
        return null;
    }

    if (typeof children !== 'string') {
        return (
            <Text style={style}>
                {children}
            </Text>
        )
    }

    const { servicePreferences } = useConfig();




    if (servicePreferences.bionicText) {
        return <BionicText style={style} servicePreferences={servicePreferences}>{children}</BionicText>;
    }

    return (
        <Text style={style}>
            {children}
        </Text>
    );
}