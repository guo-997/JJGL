-- NFC家庭物品管理系统 MySQL数据库初始化脚本
-- 注意：此脚本仅供参考，实际使用需要修改后端代码以支持MySQL

-- 创建数据库
CREATE DATABASE IF NOT EXISTS nfc_home_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nfc_home_manager;

-- 创建盒子表
CREATE TABLE IF NOT EXISTS boxes (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    nfc_id VARCHAR(255) UNIQUE,
    capacity INT DEFAULT 0,
    current_items INT DEFAULT 0,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nfc_id (nfc_id),
    INDEX idx_location (location)
);

-- 创建物品表
CREATE TABLE IF NOT EXISTS items (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    box_id VARCHAR(36),
    category VARCHAR(100),
    quantity INT DEFAULT 1,
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    warranty_until DATE,
    condition_status ENUM('excellent', 'good', 'fair', 'poor') DEFAULT 'good',
    tags JSON,
    specifications JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (box_id) REFERENCES boxes(id) ON DELETE SET NULL,
    INDEX idx_box_id (box_id),
    INDEX idx_category (category),
    INDEX idx_name (name),
    FULLTEXT INDEX ft_search (name, description)
);

-- 创建物品图片表
CREATE TABLE IF NOT EXISTS item_images (
    id VARCHAR(36) PRIMARY KEY,
    item_id VARCHAR(36) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    caption VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    INDEX idx_item_id (item_id)
);

-- 创建物品文档表
CREATE TABLE IF NOT EXISTS item_documents (
    id VARCHAR(36) PRIMARY KEY,
    item_id VARCHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    INDEX idx_item_id (item_id)
);

-- 创建NFC扫描记录表
CREATE TABLE IF NOT EXISTS nfc_scans (
    id VARCHAR(36) PRIMARY KEY,
    nfc_id VARCHAR(255) NOT NULL,
    box_id VARCHAR(36),
    scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent VARCHAR(500),
    ip_address VARCHAR(45),
    FOREIGN KEY (box_id) REFERENCES boxes(id) ON DELETE SET NULL,
    INDEX idx_nfc_id (nfc_id),
    INDEX idx_scan_time (scan_time)
);

-- 插入示例数据
INSERT INTO boxes (id, name, location, description, nfc_id, capacity) VALUES
('550e8400-e29b-41d4-a716-446655440000', '厨房储物盒', '厨房橱柜下层', '存放厨房用品和调料', 'NFC001', 20),
('550e8400-e29b-41d4-a716-446655440001', '卧室收纳盒', '卧室衣柜', '存放季节性衣物和配件', 'NFC002', 30),
('550e8400-e29b-41d4-a716-446655440002', '工具箱', '车库', '存放维修工具和五金件', 'NFC003', 50);

INSERT INTO items (id, name, description, box_id, category, quantity) VALUES
('660e8400-e29b-41d4-a716-446655440000', '不锈钢汤勺', '优质不锈钢材质，耐用易清洁', '550e8400-e29b-41d4-a716-446655440000', '厨具', 4),
('660e8400-e29b-41d4-a716-446655440001', '围巾', '羊毛围巾，保暖舒适', '550e8400-e29b-41d4-a716-446655440001', '服饰', 2),
('660e8400-e29b-41d4-a716-446655440002', '螺丝刀套装', '多功能螺丝刀，包含多种规格', '550e8400-e29b-41d4-a716-446655440002', '工具', 1);

-- 创建用户表（如果需要用户认证功能）
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url VARCHAR(500),
    role ENUM('admin', 'user') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- 创建视图：盒子统计信息
CREATE VIEW box_stats AS
SELECT 
    b.id,
    b.name,
    b.location,
    b.capacity,
    COUNT(i.id) as current_items,
    ROUND((COUNT(i.id) / b.capacity) * 100, 2) as fill_percentage
FROM boxes b
LEFT JOIN items i ON b.id = i.box_id
GROUP BY b.id, b.name, b.location, b.capacity;

-- 创建视图：物品搜索
CREATE VIEW item_search AS
SELECT 
    i.id,
    i.name,
    i.description,
    i.category,
    i.quantity,
    b.name as box_name,
    b.location as box_location,
    i.created_at
FROM items i
LEFT JOIN boxes b ON i.box_id = b.id;

-- 创建存储过程：获取盒子详细信息
DELIMITER //
CREATE PROCEDURE GetBoxDetails(IN box_id VARCHAR(36))
BEGIN
    SELECT 
        b.*,
        COUNT(i.id) as item_count,
        GROUP_CONCAT(i.name SEPARATOR ', ') as item_names
    FROM boxes b
    LEFT JOIN items i ON b.id = i.box_id
    WHERE b.id = box_id
    GROUP BY b.id;
END//
DELIMITER ;

-- 创建触发器：更新盒子物品数量
DELIMITER //
CREATE TRIGGER update_box_item_count_insert
AFTER INSERT ON items
FOR EACH ROW
BEGIN
    UPDATE boxes 
    SET current_items = (
        SELECT COUNT(*) 
        FROM items 
        WHERE box_id = NEW.box_id
    )
    WHERE id = NEW.box_id;
END//

CREATE TRIGGER update_box_item_count_delete
AFTER DELETE ON items
FOR EACH ROW
BEGIN
    UPDATE boxes 
    SET current_items = (
        SELECT COUNT(*) 
        FROM items 
        WHERE box_id = OLD.box_id
    )
    WHERE id = OLD.box_id;
END//

CREATE TRIGGER update_box_item_count_update
AFTER UPDATE ON items
FOR EACH ROW
BEGIN
    -- 更新旧盒子
    IF OLD.box_id IS NOT NULL THEN
        UPDATE boxes 
        SET current_items = (
            SELECT COUNT(*) 
            FROM items 
            WHERE box_id = OLD.box_id
        )
        WHERE id = OLD.box_id;
    END IF;
    
    -- 更新新盒子
    IF NEW.box_id IS NOT NULL THEN
        UPDATE boxes 
        SET current_items = (
            SELECT COUNT(*) 
            FROM items 
            WHERE box_id = NEW.box_id
        )
        WHERE id = NEW.box_id;
    END IF;
END//
DELIMITER ;

-- 授权给应用用户（请修改用户名和密码）
-- CREATE USER 'nfc_user'@'localhost' IDENTIFIED BY 'your_password_here';
-- GRANT ALL PRIVILEGES ON nfc_home_manager.* TO 'nfc_user'@'localhost';
-- FLUSH PRIVILEGES;

-- 显示创建的表
SHOW TABLES;

-- 显示表结构
DESCRIBE boxes;
DESCRIBE items; 