SET @ORIGINAL_POST_ID = 225;
SET @canonical_postfix = 'copy4';
SET @title_postfix = ' Copy4';

# post
INSERT INTO post (user_id, canonical, title, abstract, updated, published, deleted, meta)
SELECT user_id, CONCAT(canonical, (SELECT @canonical_postfix)), CONCAT(title, (SELECT @title_postfix)), abstract, updated, published, deleted, meta
FROM post
WHERE id = @ORIGINAL_POST_ID;

SET @NEW_POST_ID := (SELECT LAST_INSERT_ID());

# content_node_history
INSERT INTO content_node_history (post_id, content_node_history_id, meta, deleted)
SELECT @NEW_POST_ID, content_node_history_id, meta, deleted
FROM content_node_history
WHERE post_id = @ORIGINAL_POST_ID;

