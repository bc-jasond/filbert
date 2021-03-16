SELECT * FROM filbert.post;

set @oldId = 160;
set @newId = 200;

delete from filbert.content_node_history
where post_id = @oldId ;

update filbert.content_node_history
set post_id = @oldId
where post_id = @newId;