
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** vesper
- **Date:** 2026-02-24
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Sign in with valid credentials and reach dashboard
- **Test Code:** [TC001_Sign_in_with_valid_credentials_and_reach_dashboard.py](./TC001_Sign_in_with_valid_credentials_and_reach_dashboard.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/4a05fa9c-4682-4269-b864-69607b003de1
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Sign in shows error message for invalid credentials
- **Test Code:** [TC002_Sign_in_shows_error_message_for_invalid_credentials.py](./TC002_Sign_in_shows_error_message_for_invalid_credentials.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Sign-in error text 'invalid' not present on the page after submitting invalid credentials
- Page is showing a loading state 'Signing in…' instead of displaying an explicit error message
- No UI element with the text 'invalid' was found while the current URL remains '/auth'
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/b0a02a72-53cf-4902-a1fe-6f648e313a57
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Switch to sign up mode from auth page
- **Test Code:** [TC003_Switch_to_sign_up_mode_from_auth_page.py](./TC003_Switch_to_sign_up_mode_from_auth_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/50cf998b-8345-41bd-a0ec-2c86ec981a6e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Sign up submits and shows check-email info message
- **Test Code:** [TC004_Sign_up_submits_and_shows_check_email_info_message.py](./TC004_Sign_up_submits_and_shows_check_email_info_message.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Create account button not interactable on multiple form instances; clicking the button resulted in stale/uninteractable element errors.
- No confirmation message containing 'check email' appeared after repeated submission attempts.
- The SPA became blank or unresponsive intermittently, interrupting interactions and preventing reliable submission.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/e699b6f8-d49f-4b7b-af3c-0ea42c7a0cf2
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Sign in persists session and allows direct access to protected route
- **Test Code:** [TC005_Sign_in_persists_session_and_allows_direct_access_to_protected_route.py](./TC005_Sign_in_persists_session_and_allows_direct_access_to_protected_route.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/086eae6c-19ff-4568-83c5-fc4ada611c93
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Auth page loads with login form elements visible
- **Test Code:** [TC006_Auth_page_loads_with_login_form_elements_visible.py](./TC006_Auth_page_loads_with_login_form_elements_visible.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/3fbf8d03-0836-4c74-b14a-6be647d2d808
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Create a new journal entry and verify auto-save and sidebar listing
- **Test Code:** [TC007_Create_a_new_journal_entry_and_verify_auto_save_and_sidebar_listing.py](./TC007_Create_a_new_journal_entry_and_verify_auto_save_and_sidebar_listing.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/692a3402-2f27-4e34-9654-309a98b3bac0
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Search entries via semantic search and open a result
- **Test Code:** [TC008_Search_entries_via_semantic_search_and_open_a_result.py](./TC008_Search_entries_via_semantic_search_and_open_a_result.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Clicking a search result did not load the entry into the editor; the editor still shows the placeholder text and no entry content.
- The journal textarea (interactive element [234]) remains empty after selecting a search result and does not display the expected entry title or content.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/bf9dd3b3-d3e4-4e5b-b28e-441d5cbeba46
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Visual save-state transitions: Saving… then Saved after typing stops
- **Test Code:** [TC009_Visual_save_state_transitions_Saving_then_Saved_after_typing_stops.py](./TC009_Visual_save_state_transitions_Saving_then_Saved_after_typing_stops.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/eff72bbb-8754-4fe2-827f-7de9560d625b
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Search with a gibberish query shows no results (empty state)
- **Test Code:** [TC010_Search_with_a_gibberish_query_shows_no_results_empty_state.py](./TC010_Search_with_a_gibberish_query_shows_no_results_empty_state.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Sidebar search did not display the exact 'No results' text after searching for a query with no matches.
- Sidebar still shows existing entries (4 similar entries) after searching for an unlikely query, indicating results were returned instead of an empty-state.
- Alternative empty-state text ('Write your first entry to see AI insights here.') appears in the main panel rather than in the sidebar, so there is no sidebar-specific empty-results indicator visible.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/6398759a-2718-4f95-92c3-c769fc6b6d40
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Insight panel shows loading skeleton then renders completed analysis (happy path)
- **Test Code:** [TC011_Insight_panel_shows_loading_skeleton_then_renders_completed_analysis_happy_path.py](./TC011_Insight_panel_shows_loading_skeleton_then_renders_completed_analysis_happy_path.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- No journal entries present in the sidebar - entries area shows an empty state or skeleton placeholders instead of selectable entries.
- Insight panel loading skeleton not visible because no journal entry was selected.
- Mood score not visible in the insight panel because there is no selected entry to analyze.
- Verification steps requiring selecting an existing journal entry cannot be performed due to the missing entries.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/6ea5fceb-17ac-4bc4-8321-b34aa5aac0ca
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Insight panel updates when switching between two entries
- **Test Code:** [TC012_Insight_panel_updates_when_switching_between_two_entries.py](./TC012_Insight_panel_updates_when_switching_between_two_entries.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/2cbddf45-7cf7-4442-ac17-e16b62254ee1
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Fallback state: Analysis unavailable when analysis fails
- **Test Code:** [TC013_Fallback_state_Analysis_unavailable_when_analysis_fails.py](./TC013_Fallback_state_Analysis_unavailable_when_analysis_fails.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- 'Analysis unavailable' fallback text not found on the dashboard after selecting journal entries and waiting for insights to load.
- No visible or interactive UI element contains the exact text 'Analysis unavailable' on the current page.
- The insight panel displays either a loading state ('Analysing…') or the placeholder 'Write your first entry to see AI insights here.' but never the 'Analysis unavailable' fallback.
- A stale/non-interactable element error occurred once while attempting to select a sidebar entry, but other entries loaded and still did not show the fallback message.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/3afb4062-e2ee-4907-9ba8-5e1b295eb7c0
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Mood score is displayed as a colored arc in the insight panel
- **Test Code:** [TC014_Mood_score_is_displayed_as_a_colored_arc_in_the_insight_panel.py](./TC014_Mood_score_is_displayed_as_a_colored_arc_in_the_insight_panel.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Mood score arc visualization not visible in the Insights panel for the active journal entry (no colored arc detected; only placeholder shapes are shown).
- Insights panel shows the text 'Analysing…' and placeholder UI instead of a rendered mood arc, indicating the visualization did not render.
- Numeric mood score is present in the sidebar but the corresponding colored arc visualization is missing from the entry view.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/a62d53d4-31fb-4bc1-95f3-afdab9c3e8a3
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Themes render as pill tags in the insight panel
- **Test Code:** [TC015_Themes_render_as_pill_tags_in_the_insight_panel.py](./TC015_Themes_render_as_pill_tags_in_the_insight_panel.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/1fc5712f-bb88-459f-bb75-bb05165ff8bc
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Cognitive distortions render as warning cards
- **Test Code:** [TC016_Cognitive_distortions_render_as_warning_cards.py](./TC016_Cognitive_distortions_render_as_warning_cards.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/a5f3f294-f1c2-4598-9f12-57f40e7455eb
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017 Insight panel shows sentiment/observation text when analysis is available
- **Test Code:** [TC017_Insight_panel_shows_sentimentobservation_text_when_analysis_is_available.py](./TC017_Insight_panel_shows_sentimentobservation_text_when_analysis_is_available.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/8f82c2aa-72ca-43ce-9751-e766abc84e3e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC018 Insight panel remains present and readable after scrolling the dashboard layout
- **Test Code:** [TC018_Insight_panel_remains_present_and_readable_after_scrolling_the_dashboard_layout.py](./TC018_Insight_panel_remains_present_and_readable_after_scrolling_the_dashboard_layout.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- No journal entries present in the entries list; unable to open a journal entry.
- Insight panel is not populated; placeholder text 'Write your first entry to see AI insights here.' is displayed instead of analysis or theme pills.
- Theme pill tag not present and cannot be verified because insights are unavailable.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/bf3670b1-39b7-40b5-80d4-47a58d75508a
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC019 Load Drift Timeline and render chart after skeleton
- **Test Code:** [TC019_Load_Drift_Timeline_and_render_chart_after_skeleton.py](./TC019_Load_Drift_Timeline_and_render_chart_after_skeleton.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/6cf5360a-488b-4c2a-bd2d-99f3e51078cb
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC020 Themes pills are visible on Drift Timeline
- **Test Code:** [TC020_Themes_pills_are_visible_on_Drift_Timeline.py](./TC020_Themes_pills_are_visible_on_Drift_Timeline.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/451ebff0-c952-467e-9b23-b8e544d2a432
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC021 Filter timeline by selecting a theme pill
- **Test Code:** [TC021_Filter_timeline_by_selecting_a_theme_pill.py](./TC021_Filter_timeline_by_selecting_a_theme_pill.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/c2b08a9a-37cf-4707-b9eb-465e595f1921
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC022 Switch theme filters between two different theme pills
- **Test Code:** [TC022_Switch_theme_filters_between_two_different_theme_pills.py](./TC022_Switch_theme_filters_between_two_different_theme_pills.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Theme filter pills not found on Drift page; no clickable theme pill elements present.
- Mood timeline chart did not render and displays 'Loading timeline…', preventing verification of chart visibility.
- No UI control exists on the Drift page to change the active theme filter, so the feature cannot be tested.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/592b9f93-95d3-48e4-9e57-2025260af743
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC023 View chart tooltip information by clicking a data point
- **Test Code:** [TC023_View_chart_tooltip_information_by_clicking_a_data_point.py](./TC023_View_chart_tooltip_information_by_clicking_a_data_point.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/ac0c5d4b-cbb0-40d4-8d79-9e3b11146ef8
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC024 Drift Timeline handles slow loading by keeping skeleton until chart appears
- **Test Code:** [TC024_Drift_Timeline_handles_slow_loading_by_keeping_skeleton_until_chart_appears.py](./TC024_Drift_Timeline_handles_slow_loading_by_keeping_skeleton_until_chart_appears.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/f5b35c2a-809f-400e-a6ba-1d1769407e44
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC025 Empty state when no themes are available for the user
- **Test Code:** [TC025_Empty_state_when_no_themes_are_available_for_the_user.py](./TC025_Empty_state_when_no_themes_are_available_for_the_user.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Drift Timeline page does not display 'No themes' — theme chips are visible (e.g., 'burnout', 'comfort from small pleasures').
- Drift Timeline page does not display 'No analyzed entries' — chart and summary show '4 entries tracked', indicating analyzed entries exist.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/a61f2fbd-054d-4710-8776-cdb84cd3318a
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC026 Generate a new weekly report and view its details
- **Test Code:** [TC026_Generate_a_new_weekly_report_and_view_its_details.py](./TC026_Generate_a_new_weekly_report_and_view_its_details.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/54dba70b-00d0-439d-b5b7-fe19feabb3e4
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC027 Newly generated report appears in the reports list
- **Test Code:** [TC027_Newly_generated_report_appears_in_the_reports_list.py](./TC027_Newly_generated_report_appears_in_the_reports_list.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/e9f2d7c8-63f6-46ff-8890-57d6d224bfc3
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC028 Reports list loads and displays without empty-state errors
- **Test Code:** [TC028_Reports_list_loads_and_displays_without_empty_state_errors.py](./TC028_Reports_list_loads_and_displays_without_empty_state_errors.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/3268f2c2-40ce-4999-8868-5ed55eb4a9bc
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC029 Dashboard to Drift via sidebar navigation
- **Test Code:** [TC029_Dashboard_to_Drift_via_sidebar_navigation.py](./TC029_Dashboard_to_Drift_via_sidebar_navigation.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/eb413c4c-260b-4cd1-baf4-a9d2387ac5f5
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC030 Drift to Reports via sidebar navigation
- **Test Code:** [TC030_Drift_to_Reports_via_sidebar_navigation.py](./TC030_Drift_to_Reports_via_sidebar_navigation.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Reports navigation link not found in sidebar or page interactive elements on /drift, so navigation to Reports could not be performed.
- URL did not change to contain '/reports' and no clickable Reports element was available to trigger navigation.
- Unable to verify navigation from Drift Timeline to Reports because the Reports link is not present in the visible interactive elements.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/8c0e019c-c497-4845-9069-b324fe4e355c
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC031 Reports to Dashboard via sidebar navigation
- **Test Code:** [TC031_Reports_to_Dashboard_via_sidebar_navigation.py](./TC031_Reports_to_Dashboard_via_sidebar_navigation.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Sidebar 'Dashboard' navigation link not found on the Reports page at http://localhost:5173/reports.
- No interactive element labeled 'Dashboard' or equivalent was present in the page's interactive elements, so a natural sidebar navigation to Dashboard is unavailable.
- Unable to navigate from Reports to Dashboard because the required navigation control is missing on the Reports page.
- Unable to verify the URL contains '/dashboard' because navigation to Dashboard could not be performed.
- The test cannot be completed as the required UI feature (Dashboard sidebar link on the Reports page) is missing.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/6f150207-928a-4e85-a5a7-6502234f2b3a
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC032 Sign out from Dashboard redirects to Auth
- **Test Code:** [TC032_Sign_out_from_Dashboard_redirects_to_Auth.py](./TC032_Sign_out_from_Dashboard_redirects_to_Auth.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/ce755071-1ec8-4a09-881d-4f5f25b6ee93
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC033 Auth page remains accessible while authenticated
- **Test Code:** [TC033_Auth_page_remains_accessible_while_authenticated.py](./TC033_Auth_page_remains_accessible_while_authenticated.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/feb92b63-5c36-4c60-88a3-08c48ed68e17/314d3aab-c8b9-4ab2-85cf-4d6a9a3c710e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **63.64** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---