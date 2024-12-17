package org.example;

/**
 * A class demonstrating the usage of custom annotations.
 */
@Documentation("This class is an example for using the @Documentation annotation.")
public class AnnotatedClass {

    /**
     * A method with the custom annotation.
     *
     * @param input an input string
     * @return the reversed string
     */
    @Documentation("Reverses the input string.")
    public String reverse(String input) {
        if (input == null) {
            return null;
        }
        return new StringBuilder(input).reverse().toString();
    }
}
