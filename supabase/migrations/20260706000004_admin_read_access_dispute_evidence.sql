/*
  # Admin read access for dispute evidence packs

  Same class of bug as the earlier UPDATE-policy fix: engagements,
  contracts, messages and message_attachments all had SELECT policies
  scoped only to the two parties, with no admin bypass (sow_documents
  already had one). AdminDisputes needs to read all of these to render
  the engagement title, the contract/SOW terms, and the message thread
  as a read-only evidence pack — none of that was actually reachable
  under RLS.
*/

DROP POLICY IF EXISTS "Parties can view own engagements" ON engagements;
CREATE POLICY "Parties can view own engagements" ON engagements FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR vendor_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Contract parties can view contracts" ON contracts;
CREATE POLICY "Contract parties can view contracts" ON contracts FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR contractor_id = auth.uid() OR vendor_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages" ON messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can view attachments in own messages" ON message_attachments;
CREATE POLICY "Users can view attachments in own messages" ON message_attachments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages
      WHERE messages.id = message_attachments.message_id
        AND (messages.sender_id = auth.uid() OR messages.recipient_id = auth.uid())
    )
    OR public.is_admin()
  );
