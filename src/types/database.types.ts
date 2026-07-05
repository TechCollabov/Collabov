export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          reason: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      case_studies: {
        Row: {
          ai_generated_hash: string | null
          ai_keyword_tags: Json | null
          challenge: string | null
          client_quote: string | null
          created_at: string | null
          duration: string | null
          id: string
          industry: string | null
          outcomes: Json | null
          project_title: string
          services_delivered: Json | null
          solution: string | null
          team_size: number | null
          tech_stack: Json | null
          user_edited: boolean | null
          vendor_id: string
        }
        Insert: {
          ai_generated_hash?: string | null
          ai_keyword_tags?: Json | null
          challenge?: string | null
          client_quote?: string | null
          created_at?: string | null
          duration?: string | null
          id?: string
          industry?: string | null
          outcomes?: Json | null
          project_title: string
          services_delivered?: Json | null
          solution?: string | null
          team_size?: number | null
          tech_stack?: Json | null
          user_edited?: boolean | null
          vendor_id: string
        }
        Update: {
          ai_generated_hash?: string | null
          ai_keyword_tags?: Json | null
          challenge?: string | null
          client_quote?: string | null
          created_at?: string | null
          duration?: string | null
          id?: string
          industry?: string | null
          outcomes?: Json | null
          project_title?: string
          services_delivered?: Json | null
          solution?: string | null
          team_size?: number | null
          tech_stack?: Json | null
          user_edited?: boolean | null
          vendor_id?: string
        }
        Relationships: []
      }
      certifications: {
        Row: {
          contractor_id: string
          created_at: string | null
          credential_id: string | null
          credential_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_organization: string | null
          name: string
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          name: string
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      change_requests: {
        Row: {
          buyer_signed_at: string | null
          contract_id: string | null
          created_at: string | null
          description: string
          engagement_id: string | null
          id: string
          payload: Json | null
          request_type: string
          requested_by: string
          requested_by_role: string
          resolved_at: string | null
          respond_by: string
          response_note: string | null
          status: string
          vendor_signed_at: string | null
        }
        Insert: {
          buyer_signed_at?: string | null
          contract_id?: string | null
          created_at?: string | null
          description: string
          engagement_id?: string | null
          id?: string
          payload?: Json | null
          request_type: string
          requested_by: string
          requested_by_role: string
          resolved_at?: string | null
          respond_by: string
          response_note?: string | null
          status?: string
          vendor_signed_at?: string | null
        }
        Update: {
          buyer_signed_at?: string | null
          contract_id?: string | null
          created_at?: string | null
          description?: string
          engagement_id?: string | null
          id?: string
          payload?: Json | null
          request_type?: string
          requested_by?: string
          requested_by_role?: string
          resolved_at?: string | null
          respond_by?: string
          response_note?: string | null
          status?: string
          vendor_signed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          below_threshold: boolean | null
          buyer_id: string
          charge_amount: number | null
          charge_date: string | null
          check_in_type: string
          confirmed_at: string | null
          created_at: string | null
          employee_id: string | null
          engagement_id: string
          flag_note: string | null
          id: string
          opens_at: string | null
          overall_score: number | null
          period_label: string
          scores: Json | null
          status: string
          vendor_id: string
        }
        Insert: {
          below_threshold?: boolean | null
          buyer_id: string
          charge_amount?: number | null
          charge_date?: string | null
          check_in_type: string
          confirmed_at?: string | null
          created_at?: string | null
          employee_id?: string | null
          engagement_id: string
          flag_note?: string | null
          id?: string
          opens_at?: string | null
          overall_score?: number | null
          period_label: string
          scores?: Json | null
          status?: string
          vendor_id: string
        }
        Update: {
          below_threshold?: boolean | null
          buyer_id?: string
          charge_amount?: number | null
          charge_date?: string | null
          check_in_type?: string
          confirmed_at?: string | null
          created_at?: string | null
          employee_id?: string | null
          engagement_id?: string
          flag_note?: string | null
          id?: string
          opens_at?: string | null
          overall_score?: number | null
          period_label?: string
          scores?: Json | null
          status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_deliverables: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          contract_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          due_date: string | null
          id: string
          title: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          contract_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          due_date?: string | null
          id?: string
          title: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          contract_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          due_date?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_deliverables_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_services: {
        Row: {
          contract_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          price: number
          quantity: number | null
          service_name: string
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          price: number
          quantity?: number | null
          service_name: string
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          price?: number
          quantity?: number | null
          service_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_services_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_skills: {
        Row: {
          contractor_id: string
          created_at: string | null
          id: string
          skill_id: string
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          id?: string
          skill_id: string
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_skills_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          availability: Database["public"]["Enums"]["availability_type"] | null
          available_earnings: number | null
          bio: string | null
          completed_projects: number | null
          created_at: string | null
          escrow_earnings: number | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          google_oauth_id: string | null
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          languages: string[] | null
          location: string | null
          profile_views: number | null
          rating: number | null
          response_rate: number | null
          review_count: number | null
          timezone: string | null
          title: string
          total_earnings: number | null
          updated_at: string | null
        }
        Insert: {
          availability?: Database["public"]["Enums"]["availability_type"] | null
          available_earnings?: number | null
          bio?: string | null
          completed_projects?: number | null
          created_at?: string | null
          escrow_earnings?: number | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          google_oauth_id?: string | null
          hourly_rate?: number | null
          id: string
          is_available?: boolean | null
          languages?: string[] | null
          location?: string | null
          profile_views?: number | null
          rating?: number | null
          response_rate?: number | null
          review_count?: number | null
          timezone?: string | null
          title: string
          total_earnings?: number | null
          updated_at?: string | null
        }
        Update: {
          availability?: Database["public"]["Enums"]["availability_type"] | null
          available_earnings?: number | null
          bio?: string | null
          completed_projects?: number | null
          created_at?: string | null
          escrow_earnings?: number | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          google_oauth_id?: string | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          languages?: string[] | null
          location?: string | null
          profile_views?: number | null
          rating?: number | null
          response_rate?: number | null
          review_count?: number | null
          timezone?: string | null
          title?: string
          total_earnings?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractors_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          contract_number: string
          contractor_id: string | null
          created_at: string | null
          credential_log: Json | null
          customer_id: string
          customer_signature_date: string | null
          defect_liability_days: number | null
          defect_liability_end_date: string | null
          document_url: string | null
          end_date: string | null
          id: string
          notice_period_days: number | null
          offboarding_checklist: Json | null
          payment_terms: string | null
          project_id: string | null
          signed_by_customer: boolean | null
          signed_by_vendor: boolean | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"] | null
          termination_date: string | null
          termination_status: string | null
          terms_and_conditions: string | null
          title: string
          total_value: number
          updated_at: string | null
          vendor_id: string | null
          vendor_signature_date: string | null
        }
        Insert: {
          contract_number: string
          contractor_id?: string | null
          created_at?: string | null
          credential_log?: Json | null
          customer_id: string
          customer_signature_date?: string | null
          defect_liability_days?: number | null
          defect_liability_end_date?: string | null
          document_url?: string | null
          end_date?: string | null
          id?: string
          notice_period_days?: number | null
          offboarding_checklist?: Json | null
          payment_terms?: string | null
          project_id?: string | null
          signed_by_customer?: boolean | null
          signed_by_vendor?: boolean | null
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          termination_date?: string | null
          termination_status?: string | null
          terms_and_conditions?: string | null
          title: string
          total_value: number
          updated_at?: string | null
          vendor_id?: string | null
          vendor_signature_date?: string | null
        }
        Update: {
          contract_number?: string
          contractor_id?: string | null
          created_at?: string | null
          credential_log?: Json | null
          customer_id?: string
          customer_signature_date?: string | null
          defect_liability_days?: number | null
          defect_liability_end_date?: string | null
          document_url?: string | null
          end_date?: string | null
          id?: string
          notice_period_days?: number | null
          offboarding_checklist?: Json | null
          payment_terms?: string | null
          project_id?: string | null
          signed_by_customer?: boolean | null
          signed_by_vendor?: boolean | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          termination_date?: string | null
          termination_status?: string | null
          terms_and_conditions?: string | null
          title?: string
          total_value?: number
          updated_at?: string | null
          vendor_id?: string | null
          vendor_signature_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_team_members: {
        Row: {
          created_at: string | null
          customer_id: string
          email: string
          id: string
          name: string | null
          role: string
          status: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          email: string
          id?: string
          name?: string | null
          role?: string
          status?: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          email?: string
          id?: string
          name?: string | null
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_team_members_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          active_projects_count: number | null
          address: string | null
          billing_address: string | null
          blacklist_pending: boolean | null
          blacklist_reason: string | null
          blacklisted_at: string | null
          blacklisted_by: string | null
          city: string | null
          companies_house_number: string | null
          company_name: string
          company_website: string | null
          country: string | null
          created_at: string | null
          headcount_band: string | null
          id: string
          industry: string | null
          is_blacklisted: boolean | null
          late_payment_count: number | null
          legal_entity_name: string | null
          logo_url: string | null
          on_time_payment_rate: number | null
          payment_events_count: number | null
          phone: string | null
          restoration_approvals: Json | null
          state: string | null
          timezone: string | null
          total_spent: number | null
          trading_name: string | null
          updated_at: string | null
          vat_number: string | null
        }
        Insert: {
          active_projects_count?: number | null
          address?: string | null
          billing_address?: string | null
          blacklist_pending?: boolean | null
          blacklist_reason?: string | null
          blacklisted_at?: string | null
          blacklisted_by?: string | null
          city?: string | null
          companies_house_number?: string | null
          company_name: string
          company_website?: string | null
          country?: string | null
          created_at?: string | null
          headcount_band?: string | null
          id: string
          industry?: string | null
          is_blacklisted?: boolean | null
          late_payment_count?: number | null
          legal_entity_name?: string | null
          logo_url?: string | null
          on_time_payment_rate?: number | null
          payment_events_count?: number | null
          phone?: string | null
          restoration_approvals?: Json | null
          state?: string | null
          timezone?: string | null
          total_spent?: number | null
          trading_name?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Update: {
          active_projects_count?: number | null
          address?: string | null
          billing_address?: string | null
          blacklist_pending?: boolean | null
          blacklist_reason?: string | null
          blacklisted_at?: string | null
          blacklisted_by?: string | null
          city?: string | null
          companies_house_number?: string | null
          company_name?: string
          company_website?: string | null
          country?: string | null
          created_at?: string | null
          headcount_band?: string | null
          id?: string
          industry?: string | null
          is_blacklisted?: boolean | null
          late_payment_count?: number | null
          legal_entity_name?: string | null
          logo_url?: string | null
          on_time_payment_rate?: number | null
          payment_events_count?: number | null
          phone?: string | null
          restoration_approvals?: Json | null
          state?: string | null
          timezone?: string | null
          total_spent?: number | null
          trading_name?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          bilateral_deadline: string
          buyer_id: string
          buyer_position: string | null
          created_at: string | null
          description: string
          engagement_id: string | null
          escrow_amount: number | null
          flag_id: string | null
          id: string
          merge_log: Json | null
          milestone_id: string | null
          opened_at: string | null
          opened_by: string
          opened_by_role: string
          reason: string
          resolution: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          split_vendor_pct: number | null
          status: string
          vendor_id: string
          vendor_position: string | null
        }
        Insert: {
          bilateral_deadline: string
          buyer_id: string
          buyer_position?: string | null
          created_at?: string | null
          description: string
          engagement_id?: string | null
          escrow_amount?: number | null
          flag_id?: string | null
          id?: string
          merge_log?: Json | null
          milestone_id?: string | null
          opened_at?: string | null
          opened_by: string
          opened_by_role: string
          reason: string
          resolution?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          split_vendor_pct?: number | null
          status?: string
          vendor_id: string
          vendor_position?: string | null
        }
        Update: {
          bilateral_deadline?: string
          buyer_id?: string
          buyer_position?: string | null
          created_at?: string | null
          description?: string
          engagement_id?: string | null
          escrow_amount?: number | null
          flag_id?: string | null
          id?: string
          merge_log?: Json | null
          milestone_id?: string | null
          opened_at?: string | null
          opened_by?: string
          opened_by_role?: string
          reason?: string
          resolution?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          split_vendor_pct?: number | null
          status?: string
          vendor_id?: string
          vendor_position?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      engagements: {
        Row: {
          assigned_employee_id: string | null
          buyer_id: string
          charge_day: number | null
          closed_at: string | null
          contract_id: string | null
          created_at: string | null
          defect_liability_end_date: string | null
          end_date: string | null
          engagement_type: string | null
          equipment_provider: string | null
          id: string
          ir35_stamped_at: string | null
          ir35_stamped_by: string | null
          ir35_status: string | null
          job_id: string | null
          minimum_contract_months: number | null
          minimum_engagement_months: number | null
          monthly_amount: number | null
          package_id: string | null
          parent_engagement_id: string | null
          payment_model: string | null
          project_title: string | null
          proposal_id: string | null
          replacement_opened_at: string | null
          replacement_sla_days: number | null
          service_live_date: string | null
          source: string | null
          sow_id: string | null
          start_date: string | null
          status: string | null
          total_value: number | null
          vendor_id: string
          working_location: string | null
        }
        Insert: {
          assigned_employee_id?: string | null
          buyer_id: string
          charge_day?: number | null
          closed_at?: string | null
          contract_id?: string | null
          created_at?: string | null
          defect_liability_end_date?: string | null
          end_date?: string | null
          engagement_type?: string | null
          equipment_provider?: string | null
          id?: string
          ir35_stamped_at?: string | null
          ir35_stamped_by?: string | null
          ir35_status?: string | null
          job_id?: string | null
          minimum_contract_months?: number | null
          minimum_engagement_months?: number | null
          monthly_amount?: number | null
          package_id?: string | null
          parent_engagement_id?: string | null
          payment_model?: string | null
          project_title?: string | null
          proposal_id?: string | null
          replacement_opened_at?: string | null
          replacement_sla_days?: number | null
          service_live_date?: string | null
          source?: string | null
          sow_id?: string | null
          start_date?: string | null
          status?: string | null
          total_value?: number | null
          vendor_id: string
          working_location?: string | null
        }
        Update: {
          assigned_employee_id?: string | null
          buyer_id?: string
          charge_day?: number | null
          closed_at?: string | null
          contract_id?: string | null
          created_at?: string | null
          defect_liability_end_date?: string | null
          end_date?: string | null
          engagement_type?: string | null
          equipment_provider?: string | null
          id?: string
          ir35_stamped_at?: string | null
          ir35_stamped_by?: string | null
          ir35_status?: string | null
          job_id?: string | null
          minimum_contract_months?: number | null
          minimum_engagement_months?: number | null
          monthly_amount?: number | null
          package_id?: string | null
          parent_engagement_id?: string | null
          payment_model?: string | null
          project_title?: string | null
          proposal_id?: string | null
          replacement_opened_at?: string | null
          replacement_sla_days?: number | null
          service_live_date?: string | null
          source?: string | null
          sow_id?: string | null
          start_date?: string | null
          status?: string | null
          total_value?: number | null
          vendor_id?: string
          working_location?: string | null
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          attachment_url: string | null
          budget_from: number | null
          budget_to: number | null
          created_at: string | null
          customer_email: string
          customer_id: string
          customer_phone: string | null
          end_date: string | null
          engagement_model: string | null
          enquiry_type: string | null
          expected_output: string | null
          expires_at: string | null
          id: string
          message: string
          pending_engagement_id: string | null
          responded_at: string | null
          service_type: string | null
          start_date: string | null
          status: string | null
          subject: string
          team_size: string | null
          tech_stack: Json | null
          title: string | null
          vendor_id: string
        }
        Insert: {
          attachment_url?: string | null
          budget_from?: number | null
          budget_to?: number | null
          created_at?: string | null
          customer_email: string
          customer_id: string
          customer_phone?: string | null
          end_date?: string | null
          engagement_model?: string | null
          enquiry_type?: string | null
          expected_output?: string | null
          expires_at?: string | null
          id?: string
          message: string
          pending_engagement_id?: string | null
          responded_at?: string | null
          service_type?: string | null
          start_date?: string | null
          status?: string | null
          subject: string
          team_size?: string | null
          tech_stack?: Json | null
          title?: string | null
          vendor_id: string
        }
        Update: {
          attachment_url?: string | null
          budget_from?: number | null
          budget_to?: number | null
          created_at?: string | null
          customer_email?: string
          customer_id?: string
          customer_phone?: string | null
          end_date?: string | null
          engagement_model?: string | null
          enquiry_type?: string | null
          expected_output?: string | null
          expires_at?: string | null
          id?: string
          message?: string
          pending_engagement_id?: string | null
          responded_at?: string | null
          service_type?: string | null
          start_date?: string | null
          status?: string | null
          subject?: string
          team_size?: string | null
          tech_stack?: Json | null
          title?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_transactions: {
        Row: {
          amount: number
          buyer_id: string
          card_last4: string | null
          created_at: string | null
          engagement_id: string | null
          id: string
          milestone_id: string | null
          net_amount: number | null
          platform_fee_amount: number | null
          reference: string | null
          status: string
          transaction_type: string
          vendor_id: string
        }
        Insert: {
          amount: number
          buyer_id: string
          card_last4?: string | null
          created_at?: string | null
          engagement_id?: string | null
          id?: string
          milestone_id?: string | null
          net_amount?: number | null
          platform_fee_amount?: number | null
          reference?: string | null
          status?: string
          transaction_type: string
          vendor_id: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          card_last4?: string | null
          created_at?: string | null
          engagement_id?: string | null
          id?: string
          milestone_id?: string | null
          net_amount?: number | null
          platform_fee_amount?: number | null
          reference?: string | null
          status?: string
          transaction_type?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence: {
        Row: {
          approach: string | null
          criteria_checklist: Json | null
          delivery_description: string | null
          demo_url: string | null
          engagement_id: string | null
          executive_summary: string | null
          files: Json | null
          id: string
          locked: boolean | null
          milestone_id: string | null
          review_outcome: string | null
          reviewed_at: string | null
          status: string | null
          submitted_at: string | null
          vendor_id: string | null
        }
        Insert: {
          approach?: string | null
          criteria_checklist?: Json | null
          delivery_description?: string | null
          demo_url?: string | null
          engagement_id?: string | null
          executive_summary?: string | null
          files?: Json | null
          id?: string
          locked?: boolean | null
          milestone_id?: string | null
          review_outcome?: string | null
          reviewed_at?: string | null
          status?: string | null
          submitted_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          approach?: string | null
          criteria_checklist?: Json | null
          delivery_description?: string | null
          demo_url?: string | null
          engagement_id?: string | null
          executive_summary?: string | null
          files?: Json | null
          id?: string
          locked?: boolean | null
          milestone_id?: string | null
          review_outcome?: string | null
          reviewed_at?: string | null
          status?: string | null
          submitted_at?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      hourly_logs: {
        Row: {
          created_at: string | null
          description: string
          employee_id: string | null
          engagement_id: string
          flag_note: string | null
          hours: number
          id: string
          invoice_id: string | null
          log_date: string
          status: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          employee_id?: string | null
          engagement_id: string
          flag_note?: string | null
          hours: number
          id?: string
          invoice_id?: string | null
          log_date: string
          status?: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          employee_id?: string | null
          engagement_id?: string
          flag_note?: string | null
          hours?: number
          id?: string
          invoice_id?: string | null
          log_date?: string
          status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hourly_logs_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hourly_logs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      industries: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      interview_requests: {
        Row: {
          alternative_times: Json | null
          buyer_id: string
          confirmed_time: string | null
          created_at: string | null
          employee_id: string
          enquiry_id: string | null
          format: string
          id: string
          interview_type: string
          proposed_times: Json
          respond_by: string
          status: string
          vendor_id: string
        }
        Insert: {
          alternative_times?: Json | null
          buyer_id: string
          confirmed_time?: string | null
          created_at?: string | null
          employee_id: string
          enquiry_id?: string | null
          format?: string
          id?: string
          interview_type?: string
          proposed_times: Json
          respond_by: string
          status?: string
          vendor_id: string
        }
        Update: {
          alternative_times?: Json | null
          buyer_id?: string
          confirmed_time?: string | null
          created_at?: string | null
          employee_id?: string
          enquiry_id?: string | null
          format?: string
          id?: string
          interview_type?: string
          proposed_times?: Json
          respond_by?: string
          status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_requests_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "vendor_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_requests_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          buyer_id: string
          created_at: string | null
          description: string | null
          engagement_id: string | null
          gross_amount: number
          id: string
          invoice_number: string
          issued_at: string | null
          milestone_id: string | null
          net_amount: number | null
          period_label: string | null
          platform_fee_amount: number | null
          platform_fee_pct: number | null
          status: string
          vat_amount: number | null
          vendor_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          description?: string | null
          engagement_id?: string | null
          gross_amount: number
          id?: string
          invoice_number: string
          issued_at?: string | null
          milestone_id?: string | null
          net_amount?: number | null
          period_label?: string | null
          platform_fee_amount?: number | null
          platform_fee_pct?: number | null
          status?: string
          vat_amount?: number | null
          vendor_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          description?: string | null
          engagement_id?: string | null
          gross_amount?: number
          id?: string
          invoice_number?: string
          issued_at?: string | null
          milestone_id?: string | null
          net_amount?: number | null
          period_label?: string | null
          platform_fee_amount?: number | null
          platform_fee_pct?: number | null
          status?: string
          vat_amount?: number | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      job_attachments: {
        Row: {
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          job_id: string
          uploaded_at: string | null
        }
        Insert: {
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          job_id: string
          uploaded_at?: string | null
        }
        Update: {
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          job_id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_attachments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_skills: {
        Row: {
          created_at: string | null
          id: string
          job_id: string
          skill_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id: string
          skill_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_skills_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          admin_rejection_reason: string | null
          admin_status: string | null
          budget_amount: number
          budget_from: number | null
          budget_to: number | null
          budget_type: Database["public"]["Enums"]["budget_type"]
          category: string | null
          closed_at: string | null
          created_at: string | null
          currency: string | null
          customer_id: string
          description: string
          end_date: string | null
          engagement_model: string | null
          evaluation_criteria: Json | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          id: string
          invited_vendor_ids: Json | null
          job_kind: string | null
          location: string | null
          nda_required: boolean | null
          posted_at: string | null
          project_type: Database["public"]["Enums"]["project_type"]
          proposals_count: number | null
          service_type: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          submission_deadline: string | null
          team_size: string | null
          tech_stack: Json | null
          tender_document_url: string | null
          tender_title: string | null
          timeline: string | null
          title: string
          updated_at: string | null
          views_count: number | null
          visibility: string | null
        }
        Insert: {
          admin_rejection_reason?: string | null
          admin_status?: string | null
          budget_amount: number
          budget_from?: number | null
          budget_to?: number | null
          budget_type: Database["public"]["Enums"]["budget_type"]
          category?: string | null
          closed_at?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id: string
          description: string
          end_date?: string | null
          engagement_model?: string | null
          evaluation_criteria?: Json | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          id?: string
          invited_vendor_ids?: Json | null
          job_kind?: string | null
          location?: string | null
          nda_required?: boolean | null
          posted_at?: string | null
          project_type: Database["public"]["Enums"]["project_type"]
          proposals_count?: number | null
          service_type?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          submission_deadline?: string | null
          team_size?: string | null
          tech_stack?: Json | null
          tender_document_url?: string | null
          tender_title?: string | null
          timeline?: string | null
          title: string
          updated_at?: string | null
          views_count?: number | null
          visibility?: string | null
        }
        Update: {
          admin_rejection_reason?: string | null
          admin_status?: string | null
          budget_amount?: number
          budget_from?: number | null
          budget_to?: number | null
          budget_type?: Database["public"]["Enums"]["budget_type"]
          category?: string | null
          closed_at?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string
          description?: string
          end_date?: string | null
          engagement_model?: string | null
          evaluation_criteria?: Json | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          id?: string
          invited_vendor_ids?: Json | null
          job_kind?: string | null
          location?: string | null
          nda_required?: boolean | null
          posted_at?: string | null
          project_type?: Database["public"]["Enums"]["project_type"]
          proposals_count?: number | null
          service_type?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          submission_deadline?: string | null
          team_size?: string | null
          tech_stack?: Json | null
          tender_document_url?: string | null
          tender_title?: string | null
          timeline?: string | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          message_id: string
          uploaded_at: string | null
        }
        Insert: {
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          message_id: string
          uploaded_at?: string | null
        }
        Update: {
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          message_id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          dispute_id: string | null
          engagement_id: string | null
          enquiry_id: string | null
          flagged_off_platform: boolean | null
          id: string
          is_read: boolean | null
          parent_message_id: string | null
          project_id: string | null
          read_at: string | null
          recipient_id: string
          sender_id: string
          subject: string | null
          thread_type: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          dispute_id?: string | null
          engagement_id?: string | null
          enquiry_id?: string | null
          flagged_off_platform?: boolean | null
          id?: string
          is_read?: boolean | null
          parent_message_id?: string | null
          project_id?: string | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
          subject?: string | null
          thread_type?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          dispute_id?: string | null
          engagement_id?: string | null
          enquiry_id?: string | null
          flagged_off_platform?: boolean | null
          id?: string
          is_read?: boolean | null
          parent_message_id?: string | null
          project_id?: string | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string | null
          thread_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_flags: {
        Row: {
          check_in_id: string | null
          created_at: string | null
          engagement_id: string | null
          flagged_by: string
          flagged_criteria: Json | null
          hourly_log_ids: Json | null
          id: string
          milestone_id: string | null
          note: string | null
          resolved_at: string | null
          respond_by: string
          status: string
          vendor_response: string | null
        }
        Insert: {
          check_in_id?: string | null
          created_at?: string | null
          engagement_id?: string | null
          flagged_by: string
          flagged_criteria?: Json | null
          hourly_log_ids?: Json | null
          id?: string
          milestone_id?: string | null
          note?: string | null
          resolved_at?: string | null
          respond_by: string
          status?: string
          vendor_response?: string | null
        }
        Update: {
          check_in_id?: string | null
          created_at?: string | null
          engagement_id?: string | null
          flagged_by?: string
          flagged_criteria?: Json | null
          hourly_log_ids?: Json | null
          id?: string
          milestone_id?: string | null
          note?: string | null
          resolved_at?: string | null
          respond_by?: string
          status?: string
          vendor_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestone_flags_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_flags_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_prefs: {
        Row: {
          prefs: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          prefs?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          prefs?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_prefs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link_url: string | null
          message: string
          read_at: string | null
          related_job_id: string | null
          related_project_id: string | null
          related_proposal_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link_url?: string | null
          message: string
          read_at?: string | null
          related_job_id?: string | null
          related_project_id?: string | null
          related_proposal_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link_url?: string | null
          message?: string
          read_at?: string | null
          related_job_id?: string | null
          related_project_id?: string | null
          related_proposal_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_job_id_fkey"
            columns: ["related_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_project_id_fkey"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_proposal_id_fkey"
            columns: ["related_proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_invites: {
        Row: {
          company_name: string
          contact_email: string
          contact_name: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          inviter_id: string
          inviter_role: string
          linked_profile_id: string | null
          note: string | null
          status: string
        }
        Insert: {
          company_name: string
          contact_email: string
          contact_name?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          inviter_id: string
          inviter_role: string
          linked_profile_id?: string | null
          note?: string | null
          status?: string
        }
        Update: {
          company_name?: string
          contact_email?: string
          contact_name?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          inviter_id?: string
          inviter_role?: string
          linked_profile_id?: string | null
          note?: string | null
          status?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          brand: string
          created_at: string | null
          customer_id: string
          exp_month: number
          exp_year: number
          id: string
          is_default: boolean | null
          last4: string
        }
        Insert: {
          brand: string
          created_at?: string | null
          customer_id: string
          exp_month: number
          exp_year: number
          id?: string
          is_default?: boolean | null
          last4: string
        }
        Update: {
          brand?: string
          created_at?: string | null
          customer_id?: string
          exp_month?: number
          exp_year?: number
          id?: string
          is_default?: boolean | null
          last4?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_engagement: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          meeting_datetime: string
          proposal_id: string | null
          search_query: string | null
          status: string | null
          vendor_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          meeting_datetime: string
          proposal_id?: string | null
          search_query?: string | null
          status?: string | null
          vendor_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          meeting_datetime?: string
          proposal_id?: string | null
          search_query?: string | null
          status?: string | null
          vendor_id?: string
        }
        Relationships: []
      }
      platform_event: {
        Row: {
          actor_id: string
          actor_role: string
          entity_id: string
          entity_type: string
          event_id: string
          event_type: string
          outcome: string | null
          payload: Json | null
          timestamp: string
        }
        Insert: {
          actor_id: string
          actor_role: string
          entity_id: string
          entity_type: string
          event_id?: string
          event_type: string
          outcome?: string | null
          payload?: Json | null
          timestamp?: string
        }
        Update: {
          actor_id?: string
          actor_role?: string
          entity_id?: string
          entity_type?: string
          event_id?: string
          event_type?: string
          outcome?: string | null
          payload?: Json | null
          timestamp?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          admin_alert_email: string | null
          auto_release_days: number
          auto_release_warning_days: number
          byov_invite_expiry_days: number
          hourly_invoice_window_days: number
          id: boolean
          maintenance_mode: boolean
          minimum_project_value: number
          platform_fee_pct: number
          referral_confirmation_days: number
          updated_at: string | null
          updated_by: string | null
          vendor_verification_sla_days: number
        }
        Insert: {
          admin_alert_email?: string | null
          auto_release_days?: number
          auto_release_warning_days?: number
          byov_invite_expiry_days?: number
          hourly_invoice_window_days?: number
          id?: boolean
          maintenance_mode?: boolean
          minimum_project_value?: number
          platform_fee_pct?: number
          referral_confirmation_days?: number
          updated_at?: string | null
          updated_by?: string | null
          vendor_verification_sla_days?: number
        }
        Update: {
          admin_alert_email?: string | null
          auto_release_days?: number
          auto_release_warning_days?: number
          byov_invite_expiry_days?: number
          hourly_invoice_window_days?: number
          id?: boolean
          maintenance_mode?: boolean
          minimum_project_value?: number
          platform_fee_pct?: number
          referral_confirmation_days?: number
          updated_at?: string | null
          updated_by?: string | null
          vendor_verification_sla_days?: number
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          contractor_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          project_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          project_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          project_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          failed_login_attempts: number | null
          full_name: string
          id: string
          locked_at: string | null
          onboarding_step: number | null
          profile_completed: boolean | null
          profile_picture_url: string | null
          two_factor_backup_codes: Json | null
          two_factor_enabled: boolean | null
          two_factor_enabled_at: string | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          failed_login_attempts?: number | null
          full_name: string
          id: string
          locked_at?: string | null
          onboarding_step?: number | null
          profile_completed?: boolean | null
          profile_picture_url?: string | null
          two_factor_backup_codes?: Json | null
          two_factor_enabled?: boolean | null
          two_factor_enabled_at?: string | null
          updated_at?: string | null
          user_type: Database["public"]["Enums"]["user_type"]
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          failed_login_attempts?: number | null
          full_name?: string
          id?: string
          locked_at?: string | null
          onboarding_step?: number | null
          profile_completed?: boolean | null
          profile_picture_url?: string | null
          two_factor_backup_codes?: Json | null
          two_factor_enabled?: boolean | null
          two_factor_enabled_at?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
          verified?: boolean | null
        }
        Relationships: []
      }
      project_milestones: {
        Row: {
          acceptance_criteria: Json | null
          accepted_at: string | null
          amount: number | null
          auto_release_at: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          due_date: string | null
          engagement_id: string | null
          escrow_status: string | null
          funded_at: string | null
          github_repo: string | null
          id: string
          jira_epic_id: string | null
          milestone_type: string | null
          project_id: string
          rejection_reason: string | null
          released_at: string | null
          submitted_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          acceptance_criteria?: Json | null
          accepted_at?: string | null
          amount?: number | null
          auto_release_at?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          due_date?: string | null
          engagement_id?: string | null
          escrow_status?: string | null
          funded_at?: string | null
          github_repo?: string | null
          id?: string
          jira_epic_id?: string | null
          milestone_type?: string | null
          project_id: string
          rejection_reason?: string | null
          released_at?: string | null
          submitted_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          acceptance_criteria?: Json | null
          accepted_at?: string | null
          amount?: number | null
          auto_release_at?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          due_date?: string | null
          engagement_id?: string | null
          escrow_status?: string | null
          funded_at?: string | null
          github_repo?: string | null
          id?: string
          jira_epic_id?: string | null
          milestone_type?: string | null
          project_id?: string
          rejection_reason?: string | null
          released_at?: string | null
          submitted_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number
          completed_at: string | null
          contractor_id: string | null
          created_at: string | null
          customer_id: string
          deadline: string | null
          description: string | null
          id: string
          job_id: string | null
          progress: number | null
          start_date: string
          status: Database["public"]["Enums"]["project_status"] | null
          title: string
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          budget: number
          completed_at?: string | null
          contractor_id?: string | null
          created_at?: string | null
          customer_id: string
          deadline?: string | null
          description?: string | null
          id?: string
          job_id?: string | null
          progress?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["project_status"] | null
          title: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          budget?: number
          completed_at?: string | null
          contractor_id?: string | null
          created_at?: string | null
          customer_id?: string
          deadline?: string | null
          description?: string | null
          id?: string
          job_id?: string | null
          progress?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["project_status"] | null
          title?: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          accepted_at: string | null
          ai_generated: boolean | null
          approach_summary: string | null
          assumptions: string | null
          contractor_id: string | null
          cover_letter: string | null
          customer_id: string | null
          discovery_fee: number | null
          enquiry_id: string | null
          exclusions: string | null
          expires_at: string | null
          id: string
          job_id: string | null
          milestones: Json | null
          pending_engagement_id: string | null
          proposal_content: string
          proposal_kind: string | null
          proposal_score: number | null
          proposed_budget: number
          proposed_team: Json | null
          proposed_timeline: string
          spec_structure: Json | null
          status: Database["public"]["Enums"]["proposal_status"] | null
          submitted_at: string | null
          timeline_days: number | null
          updated_at: string | null
          vendor_id: string | null
          workflow_state: string | null
        }
        Insert: {
          accepted_at?: string | null
          ai_generated?: boolean | null
          approach_summary?: string | null
          assumptions?: string | null
          contractor_id?: string | null
          cover_letter?: string | null
          customer_id?: string | null
          discovery_fee?: number | null
          enquiry_id?: string | null
          exclusions?: string | null
          expires_at?: string | null
          id?: string
          job_id?: string | null
          milestones?: Json | null
          pending_engagement_id?: string | null
          proposal_content: string
          proposal_kind?: string | null
          proposal_score?: number | null
          proposed_budget: number
          proposed_team?: Json | null
          proposed_timeline: string
          spec_structure?: Json | null
          status?: Database["public"]["Enums"]["proposal_status"] | null
          submitted_at?: string | null
          timeline_days?: number | null
          updated_at?: string | null
          vendor_id?: string | null
          workflow_state?: string | null
        }
        Update: {
          accepted_at?: string | null
          ai_generated?: boolean | null
          approach_summary?: string | null
          assumptions?: string | null
          contractor_id?: string | null
          cover_letter?: string | null
          customer_id?: string | null
          discovery_fee?: number | null
          enquiry_id?: string | null
          exclusions?: string | null
          expires_at?: string | null
          id?: string
          job_id?: string | null
          milestones?: Json | null
          pending_engagement_id?: string | null
          proposal_content?: string
          proposal_kind?: string | null
          proposal_score?: number | null
          proposed_budget?: number
          proposed_team?: Json | null
          proposed_timeline?: string
          spec_structure?: Json | null
          status?: Database["public"]["Enums"]["proposal_status"] | null
          submitted_at?: string | null
          timeline_days?: number | null
          updated_at?: string | null
          vendor_id?: string | null
          workflow_state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          contractor_id: string | null
          created_at: string | null
          criteria_scores: Json | null
          customer_id: string | null
          direction: string | null
          engagement_id: string | null
          id: string
          moderation_status: string | null
          project_id: string | null
          rating: number
          reviewer_id: string | null
          updated_at: string | null
          vendor_id: string | null
          window_closes_at: string | null
          would_recommend: boolean | null
        }
        Insert: {
          comment?: string | null
          contractor_id?: string | null
          created_at?: string | null
          criteria_scores?: Json | null
          customer_id?: string | null
          direction?: string | null
          engagement_id?: string | null
          id?: string
          moderation_status?: string | null
          project_id?: string | null
          rating: number
          reviewer_id?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          window_closes_at?: string | null
          would_recommend?: boolean | null
        }
        Update: {
          comment?: string | null
          contractor_id?: string | null
          created_at?: string | null
          criteria_scores?: Json | null
          customer_id?: string | null
          direction?: string | null
          engagement_id?: string | null
          id?: string
          moderation_status?: string | null
          project_id?: string | null
          rating?: number
          reviewer_id?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          window_closes_at?: string | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_vendors: {
        Row: {
          contractor_id: string | null
          created_at: string | null
          customer_id: string
          id: string
          notes: string | null
          vendor_id: string | null
        }
        Insert: {
          contractor_id?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          notes?: string | null
          vendor_id?: string | null
        }
        Update: {
          contractor_id?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          notes?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_vendors_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_vendors_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_vendors_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      sow_documents: {
        Row: {
          buyer_id: string
          buyer_signed_at: string | null
          charge_day: number | null
          contract_id: string | null
          created_at: string | null
          description: string | null
          document_url: string | null
          end_date: string | null
          engagement_id: string | null
          equipment_provider: string | null
          generated_at: string | null
          id: string
          ip_ownership: string | null
          ip_shared_terms: string | null
          ir35_answers: Json | null
          milestones: Json | null
          min_term_months: number | null
          monthly_amount: number | null
          msp_onboarding: Json | null
          obligations_summary: string | null
          payment_model: string | null
          project_title: string | null
          proposal_id: string | null
          service_type: string | null
          start_date: string | null
          status: string
          total_budget: number | null
          updated_at: string | null
          vat_position: string | null
          vendor_business_type: string | null
          vendor_id: string
          vendor_signed_at: string | null
          working_location: string | null
        }
        Insert: {
          buyer_id: string
          buyer_signed_at?: string | null
          charge_day?: number | null
          contract_id?: string | null
          created_at?: string | null
          description?: string | null
          document_url?: string | null
          end_date?: string | null
          engagement_id?: string | null
          equipment_provider?: string | null
          generated_at?: string | null
          id?: string
          ip_ownership?: string | null
          ip_shared_terms?: string | null
          ir35_answers?: Json | null
          milestones?: Json | null
          min_term_months?: number | null
          monthly_amount?: number | null
          msp_onboarding?: Json | null
          obligations_summary?: string | null
          payment_model?: string | null
          project_title?: string | null
          proposal_id?: string | null
          service_type?: string | null
          start_date?: string | null
          status?: string
          total_budget?: number | null
          updated_at?: string | null
          vat_position?: string | null
          vendor_business_type?: string | null
          vendor_id: string
          vendor_signed_at?: string | null
          working_location?: string | null
        }
        Update: {
          buyer_id?: string
          buyer_signed_at?: string | null
          charge_day?: number | null
          contract_id?: string | null
          created_at?: string | null
          description?: string | null
          document_url?: string | null
          end_date?: string | null
          engagement_id?: string | null
          equipment_provider?: string | null
          generated_at?: string | null
          id?: string
          ip_ownership?: string | null
          ip_shared_terms?: string | null
          ir35_answers?: Json | null
          milestones?: Json | null
          min_term_months?: number | null
          monthly_amount?: number | null
          msp_onboarding?: Json | null
          obligations_summary?: string | null
          payment_model?: string | null
          project_title?: string | null
          proposal_id?: string | null
          service_type?: string | null
          start_date?: string | null
          status?: string
          total_budget?: number | null
          updated_at?: string | null
          vat_position?: string | null
          vendor_business_type?: string | null
          vendor_id?: string
          vendor_signed_at?: string | null
          working_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sow_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sow_documents_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sow_documents_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      terminations: {
        Row: {
          completed_at: string | null
          contract_id: string | null
          created_at: string | null
          engagement_id: string
          id: string
          initiated_by: string
          initiated_by_role: string
          notes: string
          notice_end_date: string
          notice_period_days: number
          reason: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          contract_id?: string | null
          created_at?: string | null
          engagement_id: string
          id?: string
          initiated_by: string
          initiated_by_role: string
          notes: string
          notice_end_date: string
          notice_period_days: number
          reason: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          contract_id?: string | null
          created_at?: string | null
          engagement_id?: string
          id?: string
          initiated_by?: string
          initiated_by_role?: string
          notes?: string
          notice_end_date?: string
          notice_period_days?: number
          reason?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "terminations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terminations_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_documents: {
        Row: {
          admin_notes: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          document_url: string
          id: string
          uploaded_at: string | null
          vendor_id: string
          verification_status: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          document_url: string
          id?: string
          uploaded_at?: string | null
          vendor_id: string
          verification_status?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          document_url?: string
          id?: string
          uploaded_at?: string | null
          vendor_id?: string
          verification_status?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_documents_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_employees: {
        Row: {
          availability_status: string | null
          available_from: string | null
          core_domain: string | null
          created_at: string | null
          email: string | null
          engaged_until: string | null
          engagement_type: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          job_title: string | null
          languages: string[] | null
          monthly_rate: number | null
          name: string
          phone: string | null
          photo_url: string | null
          role: string | null
          secondary_skills: string[] | null
          seniority: string | null
          skills: string[] | null
          updated_at: string | null
          vendor_id: string
          years_experience: number | null
        }
        Insert: {
          availability_status?: string | null
          available_from?: string | null
          core_domain?: string | null
          created_at?: string | null
          email?: string | null
          engaged_until?: string | null
          engagement_type?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          languages?: string[] | null
          monthly_rate?: number | null
          name: string
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          secondary_skills?: string[] | null
          seniority?: string | null
          skills?: string[] | null
          updated_at?: string | null
          vendor_id: string
          years_experience?: number | null
        }
        Update: {
          availability_status?: string | null
          available_from?: string | null
          core_domain?: string | null
          created_at?: string | null
          email?: string | null
          engaged_until?: string | null
          engagement_type?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          languages?: string[] | null
          monthly_rate?: number | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          secondary_skills?: string[] | null
          seniority?: string | null
          skills?: string[] | null
          updated_at?: string | null
          vendor_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_employees_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_industries: {
        Row: {
          created_at: string | null
          id: string
          industry_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          industry_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          industry_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_industries_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_industries_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_packages: {
        Row: {
          billing_period: string | null
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          billing_period?: string | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          billing_period?: string | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_packages_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_referrals: {
        Row: {
          company: string
          confirmed: boolean | null
          confirmed_at: string | null
          contact_name: string
          created_at: string | null
          id: string
          job_title: string
          project_duration: string | null
          project_value_band: string | null
          project_vouched_for: string
          relationship_type: string | null
          specific_outcome: string | null
          vendor_id: string
          work_email: string
          would_recommend: boolean | null
          written_statement: string | null
        }
        Insert: {
          company: string
          confirmed?: boolean | null
          confirmed_at?: string | null
          contact_name: string
          created_at?: string | null
          id?: string
          job_title: string
          project_duration?: string | null
          project_value_band?: string | null
          project_vouched_for: string
          relationship_type?: string | null
          specific_outcome?: string | null
          vendor_id: string
          work_email: string
          would_recommend?: boolean | null
          written_statement?: string | null
        }
        Update: {
          company?: string
          confirmed?: boolean | null
          confirmed_at?: string | null
          contact_name?: string
          created_at?: string | null
          id?: string
          job_title?: string
          project_duration?: string | null
          project_value_band?: string | null
          project_vouched_for?: string
          relationship_type?: string | null
          specific_outcome?: string | null
          vendor_id?: string
          work_email?: string
          would_recommend?: boolean | null
          written_statement?: string | null
        }
        Relationships: []
      }
      vendor_services: {
        Row: {
          base_price: number | null
          created_at: string | null
          description: string | null
          id: string
          keywords: string[] | null
          name: string
          pricing_model: string | null
          service_category_id: string | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          base_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          keywords?: string[] | null
          name: string
          pricing_model?: string | null
          service_category_id?: string | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          base_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          keywords?: string[] | null
          name?: string
          pricing_model?: string | null
          service_category_id?: string | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_services_service_category_id_fkey"
            columns: ["service_category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_services_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          account_number: string | null
          active_contracts_count: number | null
          address: string | null
          ai_keyword_tags: Json | null
          availability_from: string | null
          availability_status: string | null
          bank_address: string | null
          bank_name: string | null
          blacklist_pending: boolean | null
          blacklist_reason: string | null
          blacklisted_at: string | null
          blacklisted_by: string | null
          booking_method: string | null
          business_type: string | null
          calendly_url: string | null
          city: string | null
          company_name: string
          company_registration_number: string | null
          company_size: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          country: string | null
          created_at: string | null
          description: string | null
          dispute_outcome_count: number | null
          employee_count: number | null
          engagement_models: Json | null
          founded_year: number | null
          gdpr_ready: boolean | null
          hourly_rate: number | null
          hourly_rate_max: number | null
          hourly_rate_min: number | null
          id: string
          ifsc_code: string | null
          industry_focus: Json | null
          ir35_compliant: boolean | null
          is_blacklisted: boolean | null
          is_verified: boolean | null
          languages: Json | null
          logo_url: string | null
          minimum_project_value: number | null
          monthly_rate: number | null
          monthly_rate_max: number | null
          monthly_rate_min: number | null
          non_response_count: number | null
          operating_locations: Json | null
          profile_view_count: number | null
          projects_completed: number | null
          rating: number | null
          referral_count: number | null
          registered_email: string | null
          registered_name: string | null
          rejected_at: string | null
          rejection_reason: string | null
          response_time: string | null
          response_time_hours: number | null
          restoration_approvals: Json | null
          review_count: number | null
          service_categories: Json | null
          state: string | null
          stripe_connect_status: string | null
          stripe_connected_at: string | null
          tagline: string | null
          team_size_band: string | null
          tech_stack: Json | null
          timezone: string | null
          total_revenue: number | null
          updated_at: string | null
          verification_status: string | null
          verified_at: string | null
          website_url: string | null
          year_founded: number | null
          years_in_business: number | null
        }
        Insert: {
          account_number?: string | null
          active_contracts_count?: number | null
          address?: string | null
          ai_keyword_tags?: Json | null
          availability_from?: string | null
          availability_status?: string | null
          bank_address?: string | null
          bank_name?: string | null
          blacklist_pending?: boolean | null
          blacklist_reason?: string | null
          blacklisted_at?: string | null
          blacklisted_by?: string | null
          booking_method?: string | null
          business_type?: string | null
          calendly_url?: string | null
          city?: string | null
          company_name: string
          company_registration_number?: string | null
          company_size?: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          country?: string | null
          created_at?: string | null
          description?: string | null
          dispute_outcome_count?: number | null
          employee_count?: number | null
          engagement_models?: Json | null
          founded_year?: number | null
          gdpr_ready?: boolean | null
          hourly_rate?: number | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id: string
          ifsc_code?: string | null
          industry_focus?: Json | null
          ir35_compliant?: boolean | null
          is_blacklisted?: boolean | null
          is_verified?: boolean | null
          languages?: Json | null
          logo_url?: string | null
          minimum_project_value?: number | null
          monthly_rate?: number | null
          monthly_rate_max?: number | null
          monthly_rate_min?: number | null
          non_response_count?: number | null
          operating_locations?: Json | null
          profile_view_count?: number | null
          projects_completed?: number | null
          rating?: number | null
          referral_count?: number | null
          registered_email?: string | null
          registered_name?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          response_time?: string | null
          response_time_hours?: number | null
          restoration_approvals?: Json | null
          review_count?: number | null
          service_categories?: Json | null
          state?: string | null
          stripe_connect_status?: string | null
          stripe_connected_at?: string | null
          tagline?: string | null
          team_size_band?: string | null
          tech_stack?: Json | null
          timezone?: string | null
          total_revenue?: number | null
          updated_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          website_url?: string | null
          year_founded?: number | null
          years_in_business?: number | null
        }
        Update: {
          account_number?: string | null
          active_contracts_count?: number | null
          address?: string | null
          ai_keyword_tags?: Json | null
          availability_from?: string | null
          availability_status?: string | null
          bank_address?: string | null
          bank_name?: string | null
          blacklist_pending?: boolean | null
          blacklist_reason?: string | null
          blacklisted_at?: string | null
          blacklisted_by?: string | null
          booking_method?: string | null
          business_type?: string | null
          calendly_url?: string | null
          city?: string | null
          company_name?: string
          company_registration_number?: string | null
          company_size?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          country?: string | null
          created_at?: string | null
          description?: string | null
          dispute_outcome_count?: number | null
          employee_count?: number | null
          engagement_models?: Json | null
          founded_year?: number | null
          gdpr_ready?: boolean | null
          hourly_rate?: number | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          ifsc_code?: string | null
          industry_focus?: Json | null
          ir35_compliant?: boolean | null
          is_blacklisted?: boolean | null
          is_verified?: boolean | null
          languages?: Json | null
          logo_url?: string | null
          minimum_project_value?: number | null
          monthly_rate?: number | null
          monthly_rate_max?: number | null
          monthly_rate_min?: number | null
          non_response_count?: number | null
          operating_locations?: Json | null
          profile_view_count?: number | null
          projects_completed?: number | null
          rating?: number | null
          referral_count?: number | null
          registered_email?: string | null
          registered_name?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          response_time?: string | null
          response_time_hours?: number | null
          restoration_approvals?: Json | null
          review_count?: number | null
          service_categories?: Json | null
          state?: string | null
          stripe_connect_status?: string | null
          stripe_connected_at?: string | null
          tagline?: string | null
          team_size_band?: string | null
          tech_stack?: Json | null
          timezone?: string | null
          total_revenue?: number | null
          updated_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          website_url?: string | null
          year_founded?: number | null
          years_in_business?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_status_log: {
        Row: {
          engagement_id: string
          id: string
          status_text: string
          submitted_at: string
          vendor_id: string
          week_of: string
        }
        Insert: {
          engagement_id: string
          id?: string
          status_text: string
          submitted_at?: string
          vendor_id: string
          week_of: string
        }
        Update: {
          engagement_id?: string
          id?: string
          status_text?: string
          submitted_at?: string
          vendor_id?: string
          week_of?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_email_exists: { Args: { email_to_check: string }; Returns: boolean }
      check_vendor_rejected: {
        Args: { p_company_name: string }
        Returns: boolean
      }
      get_login_lock_status: {
        Args: { p_email: string }
        Returns: {
          is_admin_account: boolean
          is_locked: boolean
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      record_login_attempt: {
        Args: { p_email: string; p_success: boolean }
        Returns: undefined
      }
      unlock_admin_account: { Args: { p_target_id: string }; Returns: boolean }
    }
    Enums: {
      availability_type:
        | "full-time"
        | "part-time"
        | "project-based"
        | "weekends"
      budget_type: "fixed" | "hourly"
      contract_status: "active" | "pending" | "completed" | "cancelled"
      document_type:
        | "incorporation"
        | "pan"
        | "gst"
        | "msme"
        | "aoa"
        | "moa"
        | "director_details"
      experience_level: "entry" | "intermediate" | "expert"
      job_status: "open" | "in-progress" | "closed" | "cancelled"
      notification_type:
        | "new_proposal"
        | "message"
        | "milestone"
        | "payment"
        | "review"
        | "contract"
        | "enquiry"
        | "system"
      project_status:
        | "in-progress"
        | "review"
        | "completed"
        | "on-hold"
        | "cancelled"
      project_type: "one-time" | "ongoing" | "contract-to-hire"
      proposal_status: "submitted" | "interviewing" | "accepted" | "rejected"
      user_type: "customer" | "contractor" | "vendor" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      availability_type: [
        "full-time",
        "part-time",
        "project-based",
        "weekends",
      ],
      budget_type: ["fixed", "hourly"],
      contract_status: ["active", "pending", "completed", "cancelled"],
      document_type: [
        "incorporation",
        "pan",
        "gst",
        "msme",
        "aoa",
        "moa",
        "director_details",
      ],
      experience_level: ["entry", "intermediate", "expert"],
      job_status: ["open", "in-progress", "closed", "cancelled"],
      notification_type: [
        "new_proposal",
        "message",
        "milestone",
        "payment",
        "review",
        "contract",
        "enquiry",
        "system",
      ],
      project_status: [
        "in-progress",
        "review",
        "completed",
        "on-hold",
        "cancelled",
      ],
      project_type: ["one-time", "ongoing", "contract-to-hire"],
      proposal_status: ["submitted", "interviewing", "accepted", "rejected"],
      user_type: ["customer", "contractor", "vendor", "admin"],
    },
  },
} as const


export type UserType = Database['public']['Enums']['user_type']
