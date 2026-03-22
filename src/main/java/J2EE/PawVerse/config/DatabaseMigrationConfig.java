package J2EE.PawVerse.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseMigrationConfig implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            // Allow order_items.id_product to be NULL so products can be deleted
            // while preserving order history via snapshot fields (ten_product, hinh_anh, don_gia)
            jdbcTemplate.execute(
                "ALTER TABLE order_items MODIFY COLUMN id_product BIGINT NULL"
            );
            log.info("Migration: order_items.id_product set to nullable successfully");
        } catch (Exception e) {
            log.debug("Migration skipped (column may already be nullable): {}", e.getMessage());
        }
    }
}
