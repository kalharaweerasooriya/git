package com.smartinventory.repository;

import com.smartinventory.model.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    List<Sale> findTop50ByOrderBySaleDateDesc();

    List<Sale> findBySaleDateBetween(LocalDateTime from, LocalDateTime to);

    // Daily totals: [date, totalAmount, txnCount]
    @Query(value = "SELECT DATE(sale_date) AS d, SUM(total_amount) AS total, COUNT(*) AS cnt " +
            "FROM sales WHERE sale_date >= :from GROUP BY DATE(sale_date) ORDER BY d", nativeQuery = true)
    List<Object[]> dailyTotals(@Param("from") LocalDateTime from);

    // Monthly totals: [yyyy-mm, totalAmount, txnCount]
    @Query(value = "SELECT DATE_FORMAT(sale_date, '%Y-%m') AS m, SUM(total_amount) AS total, COUNT(*) AS cnt " +
            "FROM sales GROUP BY m ORDER BY m", nativeQuery = true)
    List<Object[]> monthlyTotals();

    // Top selling products: [productId, name, unitsSold, revenue]
    @Query(value = "SELECT p.id, p.name, SUM(si.quantity) AS units, SUM(si.line_total) AS revenue " +
            "FROM sale_items si JOIN products p ON p.id = si.product_id " +
            "GROUP BY p.id, p.name ORDER BY units DESC", nativeQuery = true)
    List<Object[]> productPerformance();

    @Query(value = "SELECT COALESCE(SUM(total_amount),0) FROM sales WHERE sale_date >= :from", nativeQuery = true)
    Double revenueSince(@Param("from") LocalDateTime from);

    @Query(value = "SELECT COUNT(*) FROM sales WHERE sale_date >= :from", nativeQuery = true)
    Long countSince(@Param("from") LocalDateTime from);
}
