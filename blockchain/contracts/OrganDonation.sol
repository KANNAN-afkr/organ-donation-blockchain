// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract OrganDonation {

    // ─── Structs ───────────────────────────────────────────────
    struct Donor {
        string donorId;
        string organType;
        string bloodGroup;
        uint256 timestamp;
        bool isActive;
    }

    struct Recipient {
        string recipientId;
        string organNeeded;
        string bloodGroup;
        uint8  priorityLevel; // 1=High 2=Medium 3=Low
        uint256 timestamp;
        bool isActive;
    }

    struct Allocation {
        string allocationId;
        string donorId;
        string recipientId;
        string organType;
        uint256 timestamp;
        bool isConfirmed;
    }

    struct Transplant {
        string transplantId;
        string allocationId;
        string hospitalId;
        uint256 timestamp;
        bool isCompleted;
    }

    struct OrganStatus {
        string donorId;
        string status; // "Registered","Allocated","InTransit","Delivered","Completed"
        uint256 timestamp;
    }

    // ─── Storage ───────────────────────────────────────────────
    mapping(string => Donor)      public donors;
    mapping(string => Recipient)  public recipients;
    mapping(string => Allocation) public allocations;
    mapping(string => Transplant) public transplants;
    mapping(string => OrganStatus[]) public organLifecycle;

    string[] public donorIds;
    string[] public recipientIds;

    // ─── Events ────────────────────────────────────────────────
    event DonorRegistered(string indexed donorId, string organType, string bloodGroup, uint256 timestamp);
    event RecipientRegistered(string indexed recipientId, string organNeeded, string bloodGroup, uint8 priorityLevel, uint256 timestamp);
    event OrganAllocated(string indexed allocationId, string donorId, string recipientId, string organType, uint256 timestamp);
    event OrganStatusUpdated(string indexed donorId, string status, uint256 timestamp);
    event SmartAllocationCompleted(string indexed allocationId, string donorId, string recipientId, uint256 timestamp);
    event TransplantCompleted(string indexed transplantId, string allocationId, string hospitalId, uint256 timestamp);
    event HospitalOrganAllocated(string indexed applicationId, string organType, string providingHospital, string requestingHospital, string patientName, uint256 timestamp);
    event HospitalOrganStatusUpdated(string indexed applicationId, string status, string note, uint256 timestamp);
    event OrganListed(string indexed listingId, string organType, string bloodGroup, string hospitalName, uint256 timestamp);

    // ─── Functions ─────────────────────────────────────────────

    function registerDonor(
        string memory _donorId,
        string memory _organType,
        string memory _bloodGroup
    ) external {
        require(bytes(_donorId).length > 0, "Donor ID required");
        donors[_donorId] = Donor(_donorId, _organType, _bloodGroup, block.timestamp, true);
        donorIds.push(_donorId);
        organLifecycle[_donorId].push(OrganStatus(_donorId, "Registered", block.timestamp));
        emit DonorRegistered(_donorId, _organType, _bloodGroup, block.timestamp);
        emit OrganStatusUpdated(_donorId, "Registered", block.timestamp);
    }

    function registerRecipient(
        string memory _recipientId,
        string memory _organNeeded,
        string memory _bloodGroup,
        uint8 _priorityLevel
    ) external {
        require(bytes(_recipientId).length > 0, "Recipient ID required");
        recipients[_recipientId] = Recipient(_recipientId, _organNeeded, _bloodGroup, _priorityLevel, block.timestamp, true);
        recipientIds.push(_recipientId);
        emit RecipientRegistered(_recipientId, _organNeeded, _bloodGroup, _priorityLevel, block.timestamp);
    }

    function autoAllocateOrgan(
        string memory _allocationId,
        string memory _donorId,
        string memory _recipientId,
        string memory _organType
    ) external {
        require(donors[_donorId].isActive, "Donor not active");
        require(recipients[_recipientId].isActive, "Recipient not active");
        require(
            keccak256(bytes(donors[_donorId].organType)) == keccak256(bytes(_organType)),
            "Organ type mismatch"
        );
        allocations[_allocationId] = Allocation(
            _allocationId, _donorId, _recipientId, _organType, block.timestamp, false
        );
        donors[_donorId].isActive = false;
        recipients[_recipientId].isActive = false;
        organLifecycle[_donorId].push(OrganStatus(_donorId, "Allocated", block.timestamp));
        emit OrganAllocated(_allocationId, _donorId, _recipientId, _organType, block.timestamp);
        emit OrganStatusUpdated(_donorId, "Allocated", block.timestamp);
    }

    // Smart Contract-Based Automated Matching
    function smartAutoAllocate() external returns (string memory) {
        string memory bestDonorId = "";
        string memory bestRecipientId = "";
        string memory organType = "";
        uint8 highestPriority = 3; // Start with lowest priority
        
        // Find best match based on priority and compatibility
        for (uint i = 0; i < donorIds.length; i++) {
            string memory donorId = donorIds[i];
            if (!donors[donorId].isActive) continue;
            
            for (uint j = 0; j < recipientIds.length; j++) {
                string memory recipientId = recipientIds[j];
                if (!recipients[recipientId].isActive) continue;
                
                // Check organ type match
                if (keccak256(bytes(donors[donorId].organType)) != keccak256(bytes(recipients[recipientId].organNeeded))) continue;
                
                // Check blood compatibility (simplified)
                if (!isBloodCompatible(donors[donorId].bloodGroup, recipients[recipientId].bloodGroup)) continue;
                
                // Check if this recipient has higher priority
                if (recipients[recipientId].priorityLevel <= highestPriority) {
                    highestPriority = recipients[recipientId].priorityLevel;
                    bestDonorId = donorId;
                    bestRecipientId = recipientId;
                    organType = donors[donorId].organType;
                }
            }
        }
        
        require(bytes(bestDonorId).length > 0, "No compatible match found");
        
        // Create allocation ID
        string memory allocationId = string(abi.encodePacked("auto_", bestDonorId, "_", bestRecipientId));
        
        // Perform allocation
        allocations[allocationId] = Allocation(
            allocationId, bestDonorId, bestRecipientId, organType, block.timestamp, false
        );
        donors[bestDonorId].isActive = false;
        recipients[bestRecipientId].isActive = false;
        organLifecycle[bestDonorId].push(OrganStatus(bestDonorId, "Allocated", block.timestamp));
        
        emit OrganAllocated(allocationId, bestDonorId, bestRecipientId, organType, block.timestamp);
        emit OrganStatusUpdated(bestDonorId, "Allocated", block.timestamp);
        
        return allocationId;
    }
    
    // Blood compatibility check (simplified)
    function isBloodCompatible(string memory donorBlood, string memory recipientBlood) internal pure returns (bool) {
        // O- is universal donor
        if (keccak256(bytes(donorBlood)) == keccak256(bytes("O-"))) return true;
        // AB+ is universal recipient
        if (keccak256(bytes(recipientBlood)) == keccak256(bytes("AB+"))) return true;
        // Same blood type
        if (keccak256(bytes(donorBlood)) == keccak256(bytes(recipientBlood))) return true;
        // Add more compatibility rules as needed
        return false;
    }

    function updateOrganStatus(
        string memory _donorId,
        string memory _status
    ) external {
        require(bytes(_donorId).length > 0, "Donor ID required");
        organLifecycle[_donorId].push(OrganStatus(_donorId, _status, block.timestamp));
        emit OrganStatusUpdated(_donorId, _status, block.timestamp);
    }

    function confirmTransplant(
        string memory _transplantId,
        string memory _allocationId,
        string memory _hospitalId
    ) external {
        require(!allocations[_allocationId].isConfirmed, "Already confirmed");
        allocations[_allocationId].isConfirmed = true;
        transplants[_transplantId] = Transplant(
            _transplantId, _allocationId, _hospitalId, block.timestamp, true
        );
        string memory donorId = allocations[_allocationId].donorId;
        organLifecycle[donorId].push(OrganStatus(donorId, "Completed", block.timestamp));
        emit TransplantCompleted(_transplantId, _allocationId, _hospitalId, block.timestamp);
        emit OrganStatusUpdated(donorId, "Completed", block.timestamp);
    }

    // ─── View Functions ────────────────────────────────────────
    function getDonor(string memory _donorId) external view returns (Donor memory) {
        return donors[_donorId];
    }
    
    function getAvailableDonors() external view returns (string[] memory) {
        uint count = 0;
        for (uint i = 0; i < donorIds.length; i++) {
            if (donors[donorIds[i]].isActive) count++;
        }
        
        string[] memory availableDonors = new string[](count);
        uint index = 0;
        for (uint i = 0; i < donorIds.length; i++) {
            if (donors[donorIds[i]].isActive) {
                availableDonors[index] = donorIds[i];
                index++;
            }
        }
        return availableDonors;
    }
    
    function getWaitingRecipients() external view returns (string[] memory) {
        uint count = 0;
        for (uint i = 0; i < recipientIds.length; i++) {
            if (recipients[recipientIds[i]].isActive) count++;
        }
        
        string[] memory waitingRecipients = new string[](count);
        uint index = 0;
        for (uint i = 0; i < recipientIds.length; i++) {
            if (recipients[recipientIds[i]].isActive) {
                waitingRecipients[index] = recipientIds[i];
                index++;
            }
        }
        return waitingRecipients;
    }

    function getRecipient(string memory _recipientId) external view returns (Recipient memory) {
        return recipients[_recipientId];
    }

    function getAllocation(string memory _allocationId) external view returns (Allocation memory) {
        return allocations[_allocationId];
    }

    function getTransplant(string memory _transplantId) external view returns (Transplant memory) {
        return transplants[_transplantId];
    }

    function getOrganLifecycle(string memory _donorId) external view returns (OrganStatus[] memory) {
        return organLifecycle[_donorId];
    }

    function getDonorCount() external view returns (uint256) {
        return donorIds.length;
    }

    function getRecipientCount() external view returns (uint256) {
        return recipientIds.length;
    }

    // Record hospital-to-hospital organ allocation (new flow)
    function recordHospitalAllocation(
        string memory _applicationId,
        string memory _organType,
        string memory _providingHospital,
        string memory _requestingHospital,
        string memory _patientName
    ) external {
        emit HospitalOrganAllocated(_applicationId, _organType, _providingHospital, _requestingHospital, _patientName, block.timestamp);
    }

    // Record organ listing by hospital
    function recordOrganListing(
        string memory _listingId,
        string memory _organType,
        string memory _bloodGroup,
        string memory _hospitalName
    ) external {
        emit OrganListed(_listingId, _organType, _bloodGroup, _hospitalName, block.timestamp);
    }

    // Record organ status update (new flow)
    function recordOrganStatusUpdate(
        string memory _applicationId,
        string memory _status,
        string memory _note
    ) external {
        emit HospitalOrganStatusUpdated(_applicationId, _status, _note, block.timestamp);
    }
}
