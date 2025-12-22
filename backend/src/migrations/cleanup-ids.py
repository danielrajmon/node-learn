#!/usr/bin/env python3
"""
Script to remove gaps in ID sequences in data.sql and fix all references.
Usage: python3 cleanup-ids.py <data.sql file path>
"""

import re
import sys

def cleanup_ids(file_path):
    """Remove ID gaps and fix references in SQL data file by moving highest IDs to fill gaps."""
    
    # Read the file
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Extract all question IDs
    question_pattern = r"INSERT INTO public\.questions \(id, .+?\) VALUES \((\d+),"
    existing_q_ids = set()
    for match in re.finditer(question_pattern, content):
        existing_q_ids.add(int(match.group(1)))
    
    # Extract all choice IDs and their question references
    choice_pattern = r"INSERT INTO public\.choices \(id, .+?\) VALUES \((\d+), (\d+),"
    existing_c_ids = set()
    choice_q_refs = {}
    for match in re.finditer(choice_pattern, content):
        choice_id = int(match.group(1))
        q_id = int(match.group(2))
        existing_c_ids.add(choice_id)
        choice_q_refs[choice_id] = q_id
    
    # Check for invalid question references
    invalid_q_ids = set()
    for choice_id, q_id in choice_q_refs.items():
        if q_id not in existing_q_ids:
            invalid_q_ids.add(q_id)
    
    if invalid_q_ids:
        print(f"⚠️  Found invalid question references: {sorted(invalid_q_ids)}")
        print("❌ Please fix invalid references first!")
        return False
    
    # Build mapping: move highest IDs to fill gaps from END
    def build_gap_mapping(existing_ids):
        """Map old IDs to new IDs by filling gaps with highest IDs."""
        if not existing_ids:
            return {}
        
        sorted_ids = sorted(existing_ids)
        max_id = max(existing_ids)
        
        # Find all gaps
        gaps = [i for i in range(1, max_id + 1) if i not in existing_ids]
        
        if not gaps:
            return {id_: id_ for id_ in existing_ids}
        
        # IDs to reassign: the highest N IDs where N = number of gaps
        ids_to_move = sorted_ids[-len(gaps):]
        
        # Map gaps (from end) to IDs to move (from end)
        mapping = {id_: id_ for id_ in existing_ids}
        for gap, id_to_move in zip(reversed(gaps), reversed(ids_to_move)):
            mapping[id_to_move] = gap
        
        return mapping
    
    old_to_new_q = build_gap_mapping(existing_q_ids)
    old_to_new_c = build_gap_mapping(existing_c_ids)
    
    # Replace question IDs (process in reverse order to avoid conflicts)
    for old_id in sorted(old_to_new_q.keys(), reverse=True):
        new_id = old_to_new_q[old_id]
        if old_id != new_id:
            pattern = rf"(INSERT INTO public\.questions \(id, .+?\) VALUES \(){old_id}(,)"
            content = re.sub(pattern, rf"\g<1>{new_id}\2", content)
    
    # Replace choice IDs and their question_id references
    for old_choice_id in sorted(old_to_new_c.keys(), reverse=True):
        new_choice_id = old_to_new_c[old_choice_id]
        old_q_id = choice_q_refs[old_choice_id]
        new_q_id = old_to_new_q[old_q_id]
        
        if old_choice_id != new_choice_id or old_q_id != new_q_id:
            pattern = rf"(INSERT INTO public\.choices \(id, .+?\) VALUES \(){old_choice_id}, {old_q_id}(,)"
            content = re.sub(pattern, rf"\g<1>{new_choice_id}, {new_q_id}\2", content)
    
    # Write the file back
    with open(file_path, 'w') as f:
        f.write(content)
    
    q_gaps = [i for i in range(1, max(existing_q_ids) + 1) if i not in existing_q_ids]
    c_gaps = [i for i in range(1, max(existing_c_ids) + 1) if i not in existing_c_ids]
    
    print(f"✓ Filled {len(q_gaps)} question ID gaps by moving highest IDs")
    print(f"✓ Filled {len(c_gaps)} choice ID gaps by moving highest IDs")
    print(f"✓ Updated all choice question_id references")
    return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 cleanup-ids.py <data.sql file path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    success = cleanup_ids(file_path)
    sys.exit(0 if success else 1)
