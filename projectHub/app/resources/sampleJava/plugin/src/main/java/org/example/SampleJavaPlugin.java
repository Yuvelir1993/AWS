package org.example;

import org.example.tasks.ShowConfigTask;
import org.gradle.api.Plugin;
import org.gradle.api.Project;

/**
 * A simple 'hello world' plugin that demonstrates Gradle plugin basics.
 * <p>
 * This plugin registers a custom task named 'greeting' that prints a message.
 * </p>
 */
public class SampleJavaPlugin implements Plugin<Project> {
    /**
     * Applies the plugin to the specified project.
     *
     * @param project the Gradle project to which this plugin is applied
     */
    @Override
    public void apply(Project project) {
        project.getTasks().register("greeting", task -> {
            task.doLast(s -> System.out.println("Hello from plugin 'org.example.greeting'"));
        });

        project.getExtensions().create("sampleExtension", SampleExtension.class);
        project.getTasks().register("showConfig", ShowConfigTask.class);
    }
}
