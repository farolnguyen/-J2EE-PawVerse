package J2EE.PawVerse.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseTestRunner {
    
    @Bean
    CommandLineRunner testDatabaseConnection(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("SELECT 1");
                System.out.println("✅ DATABASE CONNECTION SUCCESSFUL!");
                System.out.println("✅ PawVerse Application is ready to start development!");
            } catch (Exception e) {
                System.err.println("❌ DATABASE CONNECTION FAILED!");
                System.err.println("Error: " + e.getMessage());
            }
        };
    }
}
