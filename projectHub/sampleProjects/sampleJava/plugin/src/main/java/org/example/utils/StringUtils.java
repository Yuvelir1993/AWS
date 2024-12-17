package org.example.utils;

/**
 * A utility class for string-related operations.
 */
public final class StringUtils {
    private StringUtils() {
        // Prevent instantiation
    }

    /**
     * Capitalizes the first letter of a string.
     *
     * @param input the input string
     * @return the capitalized string, or null if input is null
     */
    public static String capitalize(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }
        return input.substring(0, 1).toUpperCase() + input.substring(1);
    }
}
