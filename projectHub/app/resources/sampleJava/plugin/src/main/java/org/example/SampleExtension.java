package org.example;

/**
 * A sample extension for configuring the SampleJavaPlugin.
 * <p>
 * This extension allows users to specify a custom greeting message.
 * </p>
 */
public class SampleExtension {
    /**
     * The greeting message to use in the plugin.
     */
    private String greetingMessage = "Hello, world!";

    /**
     * Returns the greeting message.
     *
     * @return the greeting message
     */
    public String getGreetingMessage() {
        return greetingMessage;
    }

    /**
     * Sets a custom greeting message.
     *
     * @param greetingMessage the custom greeting message
     */
    public void setGreetingMessage(String greetingMessage) {
        this.greetingMessage = greetingMessage;
    }
}
