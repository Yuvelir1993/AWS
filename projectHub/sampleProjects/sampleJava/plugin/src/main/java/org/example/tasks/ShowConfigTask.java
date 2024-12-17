package org.example.tasks;

import org.gradle.api.DefaultTask;
import org.gradle.api.tasks.TaskAction;
import org.example.SampleExtension;

/**
 * A custom task that prints the plugin's configuration.
 */
public abstract class ShowConfigTask extends DefaultTask {
    /**
     * Prints the configured greeting message to the console.
     */
    @TaskAction
    public void showConfiguration() {
        SampleExtension extension = getProject().getExtensions().findByType(SampleExtension.class);
        if (extension != null) {
            System.out.println("Configured greeting message: " + extension.getGreetingMessage());
        } else {
            System.out.println("SampleExtension not found.");
        }
    }
}
